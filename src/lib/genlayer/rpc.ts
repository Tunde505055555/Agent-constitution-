import { createClient } from "genlayer-js";
import { localnet, studionet, testnetBradbury } from "genlayer-js/chains";
import type { CalldataEncodable } from "genlayer-js/types";

import { CONTRACT_ADDRESS } from "./networks";
import type {
  ActionRecord,
  Agent,
  AgentScore,
  Appeal,
  ConfidenceBucket,
  Constitution,
  ConstitutionClient,
  ConstitutionRule,
  Severity,
  Verdict,
  VerdictStatus,
} from "./types";

export class GenLayerRpcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenLayerRpcError";
  }
}

export interface LiveConfig {
  rpcUrl: string;
  chainId: number;
  account?: string;
}

type Eth = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };
const ADDR = CONTRACT_ADDRESS as `0x${string}`;

function getEthereum(): Eth | undefined {
  return typeof window !== "undefined" ? (window as unknown as { ethereum?: Eth }).ethereum : undefined;
}

function chainFor(config: LiveConfig) {
  const base =
    config.chainId === testnetBradbury.id ? testnetBradbury : config.chainId === localnet.id ? localnet : studionet;
  return { ...base, id: config.chainId, rpcUrls: { default: { http: [config.rpcUrl] } } };
}

function isStudio(config: LiveConfig) {
  return config.chainId !== testnetBradbury.id;
}

function makeClient(config: LiveConfig) {
  if (!config.rpcUrl) throw new GenLayerRpcError("No RPC endpoint configured.");
  const eth = getEthereum();
  return createClient({
    chain: chainFor(config) as never,
    endpoint: config.rpcUrl,
    ...(config.account ? { account: config.account as `0x${string}` } : {}),
    ...(eth && config.account ? { provider: eth as never } : {}),
  });
}

/** Convert Maps / bigints into plain values and parse JSON strings the contract returns. */
function normalize(value: unknown): unknown {
  if (value instanceof Map) {
    const o: Record<string, unknown> = {};
    value.forEach((v, k) => (o[String(k)] = normalize(v)));
    return o;
  }
  if (typeof value === "bigint") return Number(value);
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object" && !(value instanceof Uint8Array)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalize(v)]));
  }
  if (typeof value === "string") {
    const t = value.trim();
    if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
      try {
        return normalize(JSON.parse(t));
      } catch {
        return value;
      }
    }
  }
  return value;
}

/** Pull the contract's own error message (e.g. "unknown agent") out of a failed call. */
function contractMessage(e: unknown): string | undefined {
  let cur = e as { cause?: unknown; data?: { receipt?: { result?: string } } } | undefined;
  for (let i = 0; cur && i < 6; i++) {
    const b64 = cur.data?.receipt?.result;
    if (typeof b64 === "string" && b64) {
      try {
        const text = atob(b64).replace(/^[\x00-\x1f]+/, "").trim();
        if (text && !/^exit_code/i.test(text)) return text;
      } catch {
        /* ignore */
      }
    }
    cur = cur.cause as typeof cur;
  }
  return undefined;
}

function friendly(e: unknown): string {
  const fromContract = contractMessage(e);
  if (fromContract) return fromContract;
  const err = e as { shortMessage?: string; details?: string; message?: string };
  const text = [err?.details, err?.shortMessage, err?.message].filter(Boolean).join(" | ") || String(e);
  const user = text.match(/UserError[:\s]+([^|"\n]+)/i) ?? text.match(/"([a-z][^"]{6,120})"/);
  if (/User (rejected|denied)/i.test(text)) return "You cancelled the request in MetaMask.";
  if (/Wallet is on chain/i.test(text)) return "Switch MetaMask to the selected GenLayer network and try again.";
  if (user?.[1] && !/execution failed/i.test(user[1])) return user[1].trim();
  return err?.shortMessage ?? err?.message ?? String(e);
}

async function read<T>(config: LiveConfig, method: string, args: unknown[] = []): Promise<T> {
  try {
    const r = await makeClient(config).readContract({
      address: ADDR,
      functionName: method,
      args: args as CalldataEncodable[],
    });
    return normalize(r) as T;
  } catch (e) {
    throw new GenLayerRpcError(friendly(e));
  }
}

async function simulate<T>(config: LiveConfig, method: string, args: unknown[] = []): Promise<T> {
  try {
    const r = await makeClient(config).simulateWriteContract({
      address: ADDR,
      functionName: method,
      args: args as CalldataEncodable[],
    });
    return normalize(r) as T;
  } catch (e) {
    throw new GenLayerRpcError(friendly(e));
  }
}

async function rawRpc(url: string, method: string, params: unknown[]) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  return (await r.json()) as { result?: unknown; error?: { message?: string } };
}

/** Make sure MetaMask is on the selected GenLayer chain. */
async function ensureWalletChain(config: LiveConfig) {
  const eth = getEthereum();
  if (!eth) throw new GenLayerRpcError("MetaMask was not found in this browser.");
  const hex = `0x${config.chainId.toString(16)}`;
  const current = (await eth.request({ method: "eth_chainId" })) as string;
  if (current?.toLowerCase() === hex) return;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
  } catch {
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: hex,
          chainName: `GenLayer ${config.chainId}`,
          rpcUrls: [config.rpcUrl],
          nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
        },
      ],
    });
  }
}

/** On GenLayer Studio networks, top up the connected wallet from the studio faucet if it is empty. */
async function ensureStudioFunds(config: LiveConfig) {
  if (!isStudio(config) || !config.account) return;
  try {
    const bal = await rawRpc(config.rpcUrl, "eth_getBalance", [config.account, "latest"]);
    const wei = BigInt((bal.result as string) ?? "0x0");
    if (wei < 10n ** 20n) await rawRpc(config.rpcUrl, "sim_fundAccount", [config.account, (10n ** 21n).toString()]);
  } catch {
    /* faucet is best-effort */
  }
}

async function write(config: LiveConfig, method: string, args: unknown[] = []): Promise<void> {
  if (!config.account) throw new GenLayerRpcError("Connect MetaMask before sending a transaction.");
  try {
    await ensureWalletChain(config);
    await ensureStudioFunds(config);
    const client = makeClient(config);
    const callArgs = args as CalldataEncodable[];
    const est = await client.estimateTransactionFees({
      leaderTimeunitsAllocation: 200n,
      validatorTimeunitsAllocation: 400n,
    } as never);
    const fees = { distribution: est.distribution, feeValue: est.feeValue };
    const hash = await client.writeContract({
      address: ADDR,
      functionName: method,
      args: callArgs,
      value: 0n,
      fees: fees as never,
    });
    const receipt = (await client.waitForTransactionReceipt({
      hash,
      waitUntil: "decided",
      interval: 3000,
      retries: 200,
    } as never)) as unknown as Record<string, unknown>;
    const resultName = String(receipt?.["result_name"] ?? receipt?.["resultName"] ?? "");
    const exec = JSON.stringify(receipt ?? {});
    if (/"execution_result":"ERROR"/.test(exec) || /DISAGREE|UNDETERMINED|TIMEOUT/.test(resultName)) {
      const msg = exec.match(/UserError[^"]*?:\s*([^"\\]+)/)?.[1];
      throw new GenLayerRpcError(msg ? msg.trim() : `Transaction did not succeed (${resultName || "error"}).`);
    }
  } catch (e) {
    if (e instanceof GenLayerRpcError) throw e;
    throw new GenLayerRpcError(friendly(e));
  }
}

// ----------------------------- mapping helpers -----------------------------

type Raw = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v));
const n = (v: unknown) => Number(v) || 0;
const J = (v: unknown) => JSON.stringify(v ?? null);
const amt = (v: string) => Math.max(0, Math.trunc(Number(v) || 0));
const evidenceList = (text: string) =>
  text
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean);

function toSeverity(v: unknown): Severity {
  const x = s(v).toUpperCase();
  return (["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(x) ? x : "NONE") as Severity;
}
function toConfidence(v: unknown): ConfidenceBucket {
  const x = s(v).toUpperCase();
  if (x === "MEDIUM") return "MODERATE";
  return (["LOW", "MODERATE", "HIGH", "DECISIVE"].includes(x) ? x : "LOW") as ConfidenceBucket;
}

function toAgent(r: Raw): Agent {
  return {
    agentId: s(r["agent_id"]),
    name: s(r["name"]),
    mission: s(r["mission"]),
    wallet: s(r["wallet"]),
    status: s(r["status"]) === "FROZEN" ? "FROZEN" : "ACTIVE",
    ...(s(r["freeze_reason"]) ? { freezeReason: s(r["freeze_reason"]) } : {}),
    registeredAt: "",
    constitutionVersion: n(r["constitution_version"]),
  };
}

function toVerdict(r: Raw, decision?: string): Verdict {
  const notes = Array.isArray(r["evidence_notes"]) ? (r["evidence_notes"] as unknown[]).map(s) : [];
  const status = (s(r["status"]) || "WARNING") as VerdictStatus;
  return {
    status,
    severity: toSeverity(r["severity"]),
    confidence: toConfidence(r["confidence"]),
    governingRuleId: s(r["rule_id"]),
    explanation: s(r["explanation"]),
    untrustedEvidenceNotes: notes.join("\n"),
    recommendedAction: s(r["recommended_action"]),
    approved: decision ? decision === "APPROVED" : status !== "VIOLATION",
  };
}

function toAppeal(r: Raw): Appeal {
  return {
    statement: "",
    newEvidence: "",
    status: s(r["appeal_status"]) === "OVERTURNED" ? "OVERTURNED" : "UPHELD",
    ruling: `${s(r["original_verdict"])} → ${s(r["final_verdict"])} (${s(r["final_severity"])}). ${s(r["reason"])}`,
    filedAt: "",
  };
}

function toRules(doc: Raw | undefined): ConstitutionRule[] {
  const rules = Array.isArray(doc?.["rules"]) ? (doc!["rules"] as Raw[]) : [];
  return rules.map((r) => {
    const params = (r["params"] ?? r["parameters"] ?? {}) as Raw;
    return {
      id: s(r["id"]),
      article: s(r["kind"] ?? r["article"]),
      text: s(r["text"]),
      severity: toSeverity(r["severity"] ?? "MEDIUM"),
      parameters: Object.fromEntries(Object.entries(params).map(([k, v]) => [k, s(v)])),
    };
  });
}

function constitutionJson(rules: ConstitutionRule[], preamble?: string) {
  return J({
    ...(preamble ? { preamble } : {}),
    rules: rules.map((r) => ({
      id: r.id,
      kind: r.article,
      text: r.text,
      severity: r.severity,
      params: r.parameters,
    })),
  });
}

function emptyViolations(): Record<Severity, number> {
  return { NONE: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
}

// --------------------------------- client ----------------------------------

export function createLiveClient(config: LiveConfig): ConstitutionClient {
  const listIds = async () => {
    const r = await read<unknown>(config, "list_agents");
    return Array.isArray(r) ? (r as unknown[]).map(s) : [];
  };

  const getAgent = async (id: string) => toAgent(await read<Raw>(config, "get_agent", [id]));

  const getAppeal = async (agentId: string, actionId: string) => {
    const r = await read<unknown>(config, "get_appeal", [agentId, actionId]);
    return r && typeof r === "object" ? toAppeal(r as Raw) : undefined;
  };

  const actionsFor = async (agentId: string): Promise<ActionRecord[]> => {
    const raw = await read<unknown>(config, "get_actions", [agentId]);
    const list = Array.isArray(raw) ? (raw as Raw[]) : [];
    return Promise.all(
      list.map(async (a) => {
        const verdictRaw = (a["verdict"] ?? {}) as Raw;
        const verdict = toVerdict(verdictRaw);
        const appeal = verdict.status !== "COMPLIANT" ? await getAppeal(agentId, s(a["action_id"])) : undefined;
        const ev = Array.isArray(a["evidence"]) ? (a["evidence"] as unknown[]).map(s) : [];
        return {
          agentId,
          actionId: s(a["action_id"]),
          kind: s(a["kind"]),
          description: s(a["description"]),
          amount: s(a["amount_gen"]),
          counterparty: s(a["counterparty"]),
          evidence: ev.join("\n"),
          humanApproval: false,
          submittedAt: "",
          verdict,
          ...(appeal ? { appeal } : {}),
        };
      }),
    );
  };

  const getConstitution = async (agentId: string): Promise<Constitution> => {
    const version = n(await read<number>(config, "constitution_version", [agentId]));
    const versions = await Promise.all(
      Array.from({ length: version }, (_, i) => read<Raw>(config, "get_constitution", [agentId, i + 1])),
    );
    const latest = versions[versions.length - 1] ?? {};
    const doc = (latest["document"] ?? {}) as Raw;
    return {
      agentId,
      version,
      ratifiedAt: "",
      preamble: s(doc["preamble"]) || s(latest["mission"]),
      rules: toRules(doc),
      history: versions
        .map((v, i) => ({
          version: n(v["version"]) || i + 1,
          ratifiedAt: "",
          reason: s(v["amendment_reason"]),
          ruleCount: toRules((v["document"] ?? {}) as Raw).length,
        }))
        .reverse(),
    };
  };

  return {
    listAgents: async () => {
      const ids = await listIds();
      return Promise.all(ids.map(getAgent));
    },
    getAgent: async (id) => {
      try {
        return await getAgent(id);
      } catch (e) {
        if (/unknown agent/i.test(String((e as Error).message))) return null;
        throw e;
      }
    },
    agentScore: async (id): Promise<AgentScore> => {
      const [score, actions] = await Promise.all([read<Raw>(config, "agent_score", [id]), actionsFor(id)]);
      const violations = emptyViolations();
      for (const a of actions) {
        const final = a.appeal?.status === "OVERTURNED" ? null : a.verdict;
        if (final && final.status !== "COMPLIANT") violations[final.severity] += 1;
      }
      return {
        agentId: id,
        complianceScore: n(score["compliance_score"]),
        streak: n(score["streak"]),
        reviewedActions: n(score["actions_reviewed"]),
        violations,
      };
    },
    registerAgent: async (i) => {
      await write(config, "register_agent", [i.agentId, i.name, i.mission, i.wallet, constitutionJson(i.rules, i.preamble)]);
      return getAgent(i.agentId.trim());
    },
    getConstitution,
    constitutionVersion: async (id) => n(await read<number>(config, "constitution_version", [id])),
    amendConstitution: async (i) => {
      await write(config, "amend_constitution", [i.agentId, i.mission ?? "", constitutionJson(i.rules), i.reason, true]);
      return getConstitution(i.agentId);
    },
    submitAction: async (i) => {
      await write(config, "submit_action", [
        i.agentId,
        i.actionId,
        i.kind,
        i.description,
        amt(i.amount),
        i.counterparty,
        J(evidenceList(i.evidence)),
        i.humanApproval,
      ]);
      const actions = await actionsFor(i.agentId);
      const found = actions.find((a) => a.actionId === i.actionId.trim());
      if (!found) throw new GenLayerRpcError("The action was submitted but its verdict could not be read yet.");
      return found;
    },
    simulateAction: async (i) => {
      const r = await simulate<Raw>(config, "simulate_action", [
        i.agentId,
        i.kind,
        i.description,
        amt(i.amount),
        i.counterparty,
        J(evidenceList(i.evidence)),
        i.humanApproval,
      ]);
      return toVerdict((r["verdict"] ?? {}) as Raw, s(r["decision"]));
    },
    getActions: async (agentId) => {
      if (agentId) return actionsFor(agentId);
      const ids = await listIds();
      return (await Promise.all(ids.map(actionsFor))).flat();
    },
    appealVerdict: async (i) => {
      const agentId = i.agentId ?? "";
      await write(config, "appeal_verdict", [agentId, i.actionId, i.statement, J(evidenceList(i.newEvidence))]);
      const appeal = await getAppeal(agentId, i.actionId);
      if (!appeal) throw new GenLayerRpcError("The appeal was submitted but its ruling could not be read yet.");
      return { ...appeal, statement: i.statement, newEvidence: i.newEvidence };
    },
    freezeAgent: async (i) => {
      await write(config, "freeze_agent", [i.agentId, i.reason]);
      return getAgent(i.agentId);
    },
    unfreezeAgent: async (i) => {
      await write(config, "unfreeze_agent", [i.agentId, i.reviewNotes]);
      return getAgent(i.agentId);
    },
    trustPassport: async (i) => {
      const r = await simulate<Raw>(config, "trust_passport", [i.agentId]);
      const score = (r["score"] ?? {}) as Raw;
      const tier = s(r["interaction_tier"]) as never;
      return {
        counterparty: s(r["name"]) || i.agentId,
        risk: (s(r["risk"]) || "MEDIUM") as never,
        limit: tier,
        limitGen: String(n(r["recommended_interaction_limit_gen"])),
        summary: s(r["assessment"]),
        signals: [
          `Compliance score ${n(score["compliance_score"])}/100`,
          `${n(score["actions_reviewed"])} actions reviewed, ${n(score["violations"])} violations (${n(score["critical_violations"])} critical), ${n(score["warnings"])} warnings`,
          `Current status: ${s(r["status"])}`,
        ],
      };
    },
    behavioralDrift: async (id) => {
      const r = await simulate<Raw>(config, "behavioral_drift", [id]);
      const signals = Array.isArray(r["signals"]) ? (r["signals"] as unknown[]).map(s) : [];
      return {
        agentId: id,
        driftScore: n(r["drift_score"]),
        verdict: `${s(r["level"]).replace(/_/g, " ")} — ${s(r["summary"])}`,
        genesisMission: "",
        signals: signals.map((label) => ({ label, weight: 0, detail: "" })),
      };
    },
    constitutionHealth: async (id) => {
      const r = await simulate<Raw>(config, "constitution_health", [id]);
      const findings = Array.isArray(r["findings"]) ? (r["findings"] as Raw[]) : [];
      const line = (f: Raw) => `${s(f["rule_id"]) ? `[${s(f["rule_id"])}] ` : ""}${s(f["detail"])}`;
      const contradictions = findings.filter((f) => /contradict|conflict/i.test(s(f["kind"]))).map(line);
      const ambiguities = findings.filter((f) => !/contradict|conflict/i.test(s(f["kind"]))).map(
        (f) => `${s(f["kind"])}: ${line(f)}`,
      );
      return {
        band: (s(r["band"]) || "ADEQUATE") as never,
        score: n(r["health_score"]),
        summary: s(r["summary"]),
        ambiguities,
        contradictions,
        suggestions: findings.map((f) => s(f["suggestion"])).filter(Boolean),
      };
    },
    stressTest: async (i) => {
      const scenarios = i.scenarios.map((sc) => (sc.title === sc.prompt ? sc.prompt : `${sc.title}: ${sc.prompt}`));
      const r = await simulate<Raw>(config, "stress_test", [i.agentId, J(scenarios)]);
      const cases = Array.isArray(r["cases"]) ? (r["cases"] as Raw[]) : [];
      const map: Record<string, VerdictStatus> = { HANDLED: "COMPLIANT", AMBIGUOUS: "WARNING", UNCOVERED: "VIOLATION" };
      return cases.map((c, idx) => ({
        title: i.scenarios[idx]?.title ?? s(c["scenario"]),
        prompt: i.scenarios[idx]?.prompt ?? s(c["scenario"]),
        outcome: map[s(c["outcome"])] ?? "WARNING",
        governingRuleId: s(c["rule_id"]),
        notes: `${s(c["outcome"])} — ${s(c["reasoning"])}`,
      }));
    },
  };
}
