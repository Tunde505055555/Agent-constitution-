# Agent Constitution

Agent Constitution is a live GenLayer governance dApp for registering AI agents, defining their rules, adjudicating proposed actions, and auditing decisions.

## Live deployment

- Website: https://gen-constitution.lovable.app
- Preview: https://id-preview--4264dcf8-1b12-4849-b6e7-ac164e2a87ca.lovable.app
- Fixed contract: `0x67e11351025448acD773B0CcF8FA6aFF47eEd94F`
- Network: **GenLayer Studio Dev only**
- RPC: `https://studio-dev.genlayer.com/api`
- Chain ID: `61997` (`0xf22d`)
- Studio: https://studio-dev.genlayer.com

The source configuration is current. If the published website still shows an older address, publish the latest project changes before using it for evaluation.

## What this project does

An agent is registered with a mission, wallet, and constitution of written rules. Proposed actions are evaluated by the Intelligent Contract, which returns a verdict and reasoning. Users can dry-run an action before submitting it, inspect recorded decisions, appeal rulings, amend constitutions, and freeze or unfreeze agents. Diagnostic tools assess trust, mission drift, rule quality, and hypothetical stress scenarios.

The project is intended for AI-agent developers, DAO and treasury operators, automation owners, governance teams, and reviewers who need an inspectable accountability layer around autonomous behavior.

**Important boundary:** adjudication records and evaluates proposed actions. This frontend does not itself execute a trade, move the entered GEN amount to a counterparty, or guarantee that an external bot obeys the verdict. Such enforcement requires integration with that bot's execution workflow.

## Core guarantees and limitations

- Live on-chain data only: no seeded agents, mock transactions, demo-data mode, or synthetic historical records.
- Empty on-chain state produces a real empty-state prompt.
- Constitution templates are editable rule-authoring starting points, not existing on-chain agents.
- Stress-test scenarios are explicit hypothetical inputs, not claimed past activity.
- MetaMask is the only signing path. No private-key input or private-key storage.
- The contract is fixed and cannot be edited in the interface.
- The provider always uses Studio Dev, including when old browser settings contain other networks.
- Agent data is stored on GenLayer; there is no application database or application account system.
- Decisions depend on the live contract, validators, available evidence, and consensus. They are not guaranteed legal opinions or deterministic safety proofs.
- Owner-restricted operations depend on contract permission checks. Use the same signing wallet that registered the agent for amendments, appeals, and emergency governance.
- Use non-sensitive information: submitted descriptions and evidence may become publicly accessible on-chain.

## Pages

| Path | Purpose |
| --- | --- |
| `/` | Agent registry, status, compliance scores, registration |
| `/agents/$agentId` | Individual dossier, rules, and recorded actions |
| `/constitution` | Constitution viewer, version history, amendments |
| `/adjudicate` | Action form, dry run, and recorded adjudication |
| `/audit` | Searchable action history and verdict detail |
| `/governance` | Appeals, freeze, unfreeze, review notes |
| `/intelligence` | Trust passport, behavioral drift, constitution health, stress testing |

## Visitor verification walkthrough

### 1. Open and connect

1. Open the website in a browser with MetaMask installed and unlocked. On mobile, use the MetaMask in-app browser if the ordinary browser does not expose the wallet.
2. Open **GenLayer Studio Dev** in the top bar.
3. Confirm chain ID `61997` and the fixed contract address above.
4. Click **Connect MetaMask** and approve account access.
5. When a write is requested, approve adding or switching to Studio Dev if prompted. Use a development wallet, not production funds.

Reading the registry does not require a wallet. The app attempts a Studio test-funds top-up before writes if the balance is below its threshold; the faucet is best-effort and may be unavailable.

### 2. Register an actual agent

1. On the registry, click **Register agent**.
2. Enter a unique Agent ID, a name, a meaningful mission, and your agent's real wallet address.
3. Choose a constitution template or add rules manually. Review the preamble, article names, rule IDs, text, severity, and parameters.
4. For a minimal evaluator walkthrough, create a rule stating that an agent may submit status reports without sending funds. This is a proposed user-authored rule, not pre-existing data.
5. Click **Register & ratify**, approve the MetaMask transaction, and wait for confirmation.
6. Confirm the new agent appears in the registry. Open its dossier and check the mission and rules.

### 3. Dry-run and record an action

1. Open **Adjudicate** and select your registered agent.
2. Enter a unique Action ID, kind, description, GEN amount, counterparty if relevant, and evidence links or notes if available.
3. For the reporting rule above, submit a truthful proposal to produce a status report, with `0` GEN and no transfer. Do not invent evidence.
4. Use the dry-run control and inspect the verdict, governing rule, severity, confidence, and explanation. A dry run does not commit action history.
5. Submit the action for recorded adjudication and approve the MetaMask transaction.
6. Wait for consensus, then open **Audit Log** and locate the same Action ID.
7. Open its details and confirm the returned verdict. Refresh the page and verify the record remains visible.

The outcome is determined by the contract; a successful verification is a real returned verdict plus a persistent matching action record, not a promise of a specific approval.

### 4. Optional governance and diagnostics

- In **Constitution**, inspect versions and amend rules only if necessary, with an owner reason and explicit confirmation.
- In **Governance**, use the owner wallet to file an appeal with a statement and new evidence, or freeze/unfreeze an agent with review notes.
- In **Intelligence**, select the agent and run Trust Passport, Behavioral Drift, Constitution Health, or your own stress scenarios.
- Owner actions and diagnostics may take additional consensus time. Do not repeatedly submit while a request is pending.

## Expected verification outcome

After connecting MetaMask on Studio Dev, a newly registered agent appears in the live registry. A dry run returns a verdict without adding history. Submitting an action creates a matching Action ID in Audit Log with its verdict, rule, severity, confidence, and explanation. Refreshing retains the on-chain record. The fixed address remains 0x67e11351025448acD773B0CcF8FA6aFF47eEd94F, with no other network choices or demo data.

This is an expected acceptance outcome, not a claim that the new contract's complete wallet-signing flow has been re-tested in this delivery.

## Local setup

Use a current Node.js LTS release compatible with Vite 8 (Node 22.12+ recommended) and Bun 1.3+ for the included lockfile and tests.

```sh
bun install --frozen-lockfile
bun run dev
```

Open the localhost URL printed by Vite. In the hosted Lovable workspace the preview server runs on port 8080; do not assume every local installation uses the same port.

No private API keys or `.env` file are needed for the browser-to-Studio-Dev contract connection. Public RPC availability and MetaMask are still required.

### Commands

```sh
bun test src/lib/genlayer/networks.test.ts   # Fixed address and Studio Dev configuration
bun run lint                             # ESLint
bun run format                           # Prettier; modifies formatting
bun run build                            # Production build
bun run preview                          # Preview build using configured tooling
```

The build uses Lovable's TanStack/Vite configuration with a Cloudflare-oriented deployment target. This is not a plain static HTML app. Publishing through Lovable is the configured deployment path; other hosting environments may require runtime-specific configuration.

## Architecture and source guide

- **Framework:** TanStack Start v1, React 19, TypeScript, Vite 8.
- **UI:** Tailwind CSS v4 semantic tokens, shadcn/Radix controls, Lucide icons, Sonner notifications.
- **Reads/cache:** TanStack Query and GenLayer JS `2.0.0-rc.1`.
- `src/lib/genlayer/networks.ts`: fixed address, Studio Dev preset, explorer/address helpers.
- `src/lib/genlayer/provider.tsx`: shared client and account/agent selection; network selection is not persisted.
- `src/lib/genlayer/rpc.ts`: SDK reads, simulations, signed writes, receipt waiting, normalization, and output mapping.
- `src/lib/genlayer/types.ts`: frontend domain and client interface types.
- `src/lib/genlayer/hooks.ts`: query hooks and error formatting.
- `src/lib/genlayer/presets.ts`: editable constitution templates and hypothetical stress prompts.
- `src/components/app/`: shared shell, wallet panel, registration dialog, verdict rendering, states, and agent picker.
- `src/components/ui/`: reusable interface controls.
- `src/routes/`: pages and shared document shell.
- `src/styles.css`: global semantic color and typography tokens.
- `src/router.tsx`, `src/start.ts`, `src/server.ts`: router/start integration and SSR error handling.
- `vite.config.ts`: managed TanStack/Vite configuration.
- `bun.lock`: pinned dependency resolution for Bun installs.

The SDK sends structured constitutions, evidence, and scenarios as JSON strings. Maps, big integers, and JSON return strings are normalized for display. Writes wait for a decided receipt, using a three-second polling interval with up to 200 retries. Consensus latency varies; earlier tests on a separate contract copy took roughly 40–50 seconds for AI judgments.

The GEN amount in action forms is mapped to a non-negative integer. The signed governance call sends `value: 0n` plus fees; that field is not a token-transfer instruction.

## Contract methods used

`list_agents`, `get_agent`, `agent_score`, `register_agent`, `get_constitution`, `constitution_version`, `amend_constitution`, `simulate_action`, `submit_action`, `get_actions`, `get_appeal`, `appeal_verdict`, `freeze_agent`, `unfreeze_agent`, `trust_passport`, `behavioral_drift`, `constitution_health`, `stress_test`.

Trust Passport assesses the selected agent. The current frontend does not accept a separate counterparty for that diagnostic.

## Verification status and honest scope

- The fixed-address and Studio-Dev configuration tests passed after the latest address change.
- A browser check confirmed that previously saved Bradbury settings do not change the Studio Dev connection and that the new contract's registry reads successfully with an authentic empty state.
- An earlier complete contract-flow test used a **separate test copy**, not the current user-supplied address.
- MetaMask approval was not exercised in the headless test browser.
- Full registration, adjudication, and governance on the current address still require the real-wallet walkthrough above. Neither this README nor the expected outcome is proof those steps have already succeeded there.

## Source ZIP contents

The downloadable source ZIP includes frontend code, configuration, dependency lockfile, this README, submission copy, and an available Python contract reference under `contracts/agent_constitution_reference.py`.

**Contract provenance:** the Python reference is the corrected source retained from an earlier deployment. It has not been independently matched to bytecode/code at the latest address supplied by the user. Do not describe it as a verified export of that deployed contract. Obtain and compare the actual deployed source in GenLayer Studio if exact correspondence is needed.

Git metadata, credentials, dependencies, generated route trees, build output, temporary scripts, and workspace-private metadata are intentionally excluded. Generated files and installed dependencies are restored by the development tooling.

## Troubleshooting

| Symptom | Next check |
| --- | --- |
| MetaMask not detected | Install/unlock the extension or use its mobile in-app browser. |
| Transaction rejected | Review and retry only if intended; cancellation does not mean registration succeeded. |
| Empty registry | Register an agent; do not expect sample rows. |
| RPC/network error | Check Studio Dev service availability and browser network access; there is no mock-data fallback. |
| Permission error | Use the wallet that owns the selected agent. |
| Long pending request | Allow validator consensus to finish; inspect Studio before resubmitting. |
| Missing verdict after submit | Refresh/read the audit log; confirm the transaction actually reached a decided successful state. |
| Deployed site has old address | Publish the latest source changes through Lovable. |

## Security and production use

Studio Dev is a development environment. Use development wallets, treat evidence as untrusted, and never publish secrets. The browser stores account and selected-agent preferences, not private keys. Contract decisions and diagnostics depend on external services and AI consensus. Production deployment, source verification, wallet-flow validation, security review, and an integration that enforces verdicts are separate tasks.

No open-source license has been selected in this source export. Confirm licensing with the project owner before redistribution.

## Contract protections (v2, 0x67e11351025448acD773B0CcF8FA6aFF47eEd94F)

Source: `contracts/agent_constitution.py`.

1. **Who may record an action** — `submit_action` calls `_only_owner_or_agent_wallet`: the sender must be the owner who registered the agent or the agent's registered wallet. Anyone else is rejected before any AI review, and nothing is stored.
2. **Rule/severity check** — `_verify_rule` runs deterministically after consensus on both `submit_action` (via `_adjudicate`) and `appeal_verdict`. The cited rule ID must exist in the constitution version the action was judged under, and a WARNING/VIOLATION severity must equal that rule's declared severity. On mismatch the transaction aborts, so no verdict is stored and no auto-freeze occurs. Rules without a valid severity are refused at register/amend time.
