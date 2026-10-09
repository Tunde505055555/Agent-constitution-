export type Severity = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AgentStatus = "ACTIVE" | "FROZEN";
export type VerdictStatus = "COMPLIANT" | "WARNING" | "VIOLATION";
export type ConfidenceBucket = "LOW" | "MODERATE" | "HIGH" | "DECISIVE";
export type RiskRating = "LOW" | "MEDIUM" | "HIGH";
export type InteractionLimit = "NONE" | "MICRO" | "SMALL" | "STANDARD" | "LARGE";
export type HealthBand = "STRONG" | "ADEQUATE" | "WEAK" | "UNSOUND";
export type AppealStatus = "PENDING" | "UPHELD" | "OVERTURNED";

export interface ConstitutionRule {
  id: string;
  article: string;
  text: string;
  severity: Severity;
  parameters: Record<string, string>;
}

export interface Constitution {
  agentId: string;
  version: number;
  ratifiedAt: string;
  preamble: string;
  rules: ConstitutionRule[];
  history: ConstitutionVersionEntry[];
}

export interface ConstitutionVersionEntry {
  version: number;
  ratifiedAt: string;
  reason: string;
  ruleCount: number;
}

export interface Agent {
  agentId: string;
  name: string;
  mission: string;
  wallet: string;
  status: AgentStatus;
  freezeReason?: string;
  registeredAt: string;
  constitutionVersion: number;
}

export interface AgentScore {
  agentId: string;
  complianceScore: number;
  streak: number;
  reviewedActions: number;
  violations: Record<Severity, number>;
}

export interface Verdict {
  status: VerdictStatus;
  severity: Severity;
  confidence: ConfidenceBucket;
  governingRuleId: string;
  explanation: string;
  untrustedEvidenceNotes: string;
  recommendedAction: string;
  approved: boolean;
}

export interface ActionInput {
  agentId: string;
  actionId: string;
  kind: string;
  description: string;
  amount: string;
  counterparty: string;
  evidence: string;
  humanApproval: boolean;
}

export interface ActionRecord extends ActionInput {
  submittedAt: string;
  verdict: Verdict;
  appeal?: Appeal;
}

export interface Appeal {
  statement: string;
  newEvidence: string;
  status: AppealStatus;
  ruling: string;
  filedAt: string;
}

export interface TrustPassport {
  counterparty: string;
  risk: RiskRating;
  limit: InteractionLimit;
  limitGen: string;
  summary: string;
  signals: string[];
}

export interface BehavioralDrift {
  agentId: string;
  driftScore: number;
  verdict: string;
  genesisMission: string;
  signals: { label: string; weight: number; detail: string }[];
}

export interface ConstitutionHealth {
  band: HealthBand;
  score: number;
  summary: string;
  ambiguities: string[];
  contradictions: string[];
  suggestions: string[];
}

export interface StressScenario {
  title: string;
  prompt: string;
}

export interface StressResult extends StressScenario {
  outcome: VerdictStatus;
  governingRuleId: string;
  notes: string;
}

export interface RegisterAgentInput {
  agentId: string;
  name: string;
  mission: string;
  wallet: string;
  preamble: string;
  rules: ConstitutionRule[];
}

export interface ConstitutionClient {
  listAgents(): Promise<Agent[]>;
  getAgent(agentId: string): Promise<Agent | null>;
  agentScore(agentId: string): Promise<AgentScore>;
  registerAgent(input: RegisterAgentInput): Promise<Agent>;
  getConstitution(agentId: string): Promise<Constitution>;
  constitutionVersion(agentId: string): Promise<number>;
  amendConstitution(input: {
    agentId: string;
    mission?: string;
    reason: string;
    rules: ConstitutionRule[];
  }): Promise<Constitution>;
  submitAction(input: ActionInput): Promise<ActionRecord>;
  simulateAction(input: ActionInput): Promise<Verdict>;
  getActions(agentId?: string): Promise<ActionRecord[]>;
  appealVerdict(input: {
    agentId?: string;
    actionId: string;
    statement: string;
    newEvidence: string;
  }): Promise<Appeal>;
  freezeAgent(input: { agentId: string; reason: string }): Promise<Agent>;
  unfreezeAgent(input: { agentId: string; reviewNotes: string }): Promise<Agent>;
  trustPassport(input: { agentId: string; counterparty: string }): Promise<TrustPassport>;
  behavioralDrift(agentId: string): Promise<BehavioralDrift>;
  constitutionHealth(agentId: string): Promise<ConstitutionHealth>;
  stressTest(input: { agentId: string; scenarios: StressScenario[] }): Promise<StressResult[]>;
}
