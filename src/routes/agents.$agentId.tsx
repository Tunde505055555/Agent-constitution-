import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/app/AppShell";
import {
  CopyAddress,
  Pill,
  ScoreGauge,
  SeverityBadge,
  StatusBadge,
  VerdictBadge,
} from "@/components/app/badges";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActions, useAgent, useAgentScore, useConstitution } from "@/lib/genlayer/hooks";
import type { Severity } from "@/lib/genlayer/types";

export const Route = createFileRoute("/agents/$agentId")({
  head: () => ({
    meta: [
      { title: "Agent Dossier — Agent Constitution on GenLayer" },
      {
        name: "description",
        content:
          "Compliance scorecard, governing constitution and adjudicated action history for a single autonomous agent.",
      },
      { property: "og:title", content: "Agent Dossier — Agent Constitution on GenLayer" },
      {
        property: "og:description",
        content: "Compliance scorecard, constitution and adjudicated history for one agent.",
      },
    ],
  }),
  component: AgentDossier,
});

const SEVERITIES: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function AgentDossier() {
  const { agentId } = Route.useParams();
  const { data: agent, isLoading, error } = useAgent(agentId);
  const { data: score } = useAgentScore(agentId);
  const { data: constitution } = useConstitution(agentId);
  const { data: actions } = useActions(agentId);

  if (isLoading) return <LoadingState label="Loading agent dossier…" />;
  if (error) return <ErrorState error={error} />;
  if (!agent)
    return (
      <EmptyState
        title="Agent not found"
        description={`The contract has no agent registered under "${agentId}" on this network.`}
        action={
          <Link to="/" className="text-primary text-sm hover:underline">
            Back to the registry
          </Link>
        }
      />
    );

  return (
    <>
      <PageHeader
        title={agent.name}
        subtitle={agent.mission}
        action={<StatusBadge status={agent.status} />}
      />

      {agent.status === "FROZEN" && agent.freezeReason ? (
        <Alert variant="destructive" className="mb-6">
          <ShieldAlert className="size-4" />
          <AlertTitle>This agent is frozen</AlertTitle>
          <AlertDescription>{agent.freezeReason}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="panel">
          <CardHeader>
            <CardTitle className="font-display text-base">Compliance scorecard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-5">
              <ScoreGauge score={score?.complianceScore ?? 0} />
              <div className="space-y-1 text-sm">
                <p>
                  <span className="tabular-nums">{score?.streak ?? 0}</span>{" "}
                  <span className="text-muted-foreground">rules-followed streak</span>
                </p>
                <p>
                  <span className="tabular-nums">{score?.reviewedActions ?? 0}</span>{" "}
                  <span className="text-muted-foreground">actions reviewed</span>
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              {SEVERITIES.map((s) => (
                <div key={s} className="flex items-center justify-between">
                  <SeverityBadge severity={s} />
                  <span className="text-sm tabular-nums">{score?.violations?.[s] ?? 0}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader>
            <CardTitle className="font-display text-base">Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Agent ID" value={<span className="font-mono text-xs">{agent.agentId}</span>} />
            <Row label="Wallet" value={<CopyAddress address={agent.wallet} />} />
            <Row label="Status" value={agent.status} />
            <Row label="Constitution" value={<Pill>v{agent.constitutionVersion}</Pill>} />
            <Link to="/constitution" className="text-primary inline-block text-xs hover:underline">
              Open constitution studio →
            </Link>
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader>
            <CardTitle className="font-display text-base">Governing rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {constitution?.rules?.length ? (
              constitution.rules.map((rule) => (
                <div key={rule.id} className="border-border/60 rounded-md border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs">{rule.id}</span>
                    <SeverityBadge severity={rule.severity} />
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">{rule.article}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No rules returned for this agent.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="panel mt-5">
        <CardHeader>
          <CardTitle className="font-display text-base">Adjudicated actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions?.length ? (
            actions.map((a) => (
              <div
                key={a.actionId}
                className="border-border/60 flex flex-wrap items-center gap-3 rounded-md border p-3"
              >
                <span className="font-mono text-xs">{a.actionId}</span>
                <VerdictBadge status={a.verdict.status} />
                <SeverityBadge severity={a.verdict.severity} />
                <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm">
                  {a.description}
                </span>
                <span className="text-muted-foreground text-xs">{a.amount} GEN</span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              This agent has not submitted any actions yet.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground text-xs tracking-wide uppercase">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
