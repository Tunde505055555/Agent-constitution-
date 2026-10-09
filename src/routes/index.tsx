import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Flame, ShieldAlert, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/app/AppShell";
import { CopyAddress, ScoreGauge, SeverityBadge, StatusBadge } from "@/components/app/badges";
import { RegisterAgentDialog } from "@/components/app/RegisterAgentDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useAgents, useAgentScore } from "@/lib/genlayer/hooks";
import type { Agent, Severity } from "@/lib/genlayer/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agent Registry — Agent Constitution on GenLayer" },
      {
        name: "description",
        content:
          "Live registry of constitutionally governed autonomous agents, with compliance scores, freeze status and violation counts.",
      },
      { property: "og:title", content: "Agent Registry — Agent Constitution on GenLayer" },
      {
        property: "og:description",
        content: "Compliance scores, freeze status and violation counts for every registered agent.",
      },
    ],
  }),
  component: Dashboard,
});

const SEVERITIES: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function AgentCard({ agent }: { agent: Agent }) {
  const { data: score } = useAgentScore(agent.agentId);

  return (
    <Card className="panel hover:glow-cyan transition-shadow">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/agents/$agentId"
              params={{ agentId: agent.agentId }}
              className="font-display hover:text-primary block truncate text-lg font-semibold transition-colors"
            >
              {agent.name}
            </Link>
            <p className="text-muted-foreground font-mono text-xs">{agent.agentId}</p>
          </div>
          <StatusBadge status={agent.status} />
        </div>

        <p className="text-muted-foreground line-clamp-2 text-sm">{agent.mission}</p>

        {agent.status === "FROZEN" && agent.freezeReason ? (
          <Alert variant="destructive">
            <ShieldAlert className="size-4" />
            <AlertTitle>Agent frozen</AlertTitle>
            <AlertDescription className="text-xs">{agent.freezeReason}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center gap-5">
          <ScoreGauge score={score?.complianceScore ?? 0} />
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Flame className="text-warning size-4" />
              <span className="tabular-nums">{score?.streak ?? 0}</span>
              <span className="text-muted-foreground text-xs">rule-following streak</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="text-info size-4" />
              <span className="tabular-nums">{score?.reviewedActions ?? 0}</span>
              <span className="text-muted-foreground text-xs">actions reviewed</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-accent size-4" />
              <span className="text-muted-foreground text-xs">
                constitution v{agent.constitutionVersion}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {SEVERITIES.map((s) => (
            <span key={s} className="flex items-center gap-1">
              <SeverityBadge severity={s} />
              <span className="text-muted-foreground text-xs tabular-nums">
                {score?.violations?.[s] ?? 0}
              </span>
            </span>
          ))}
        </div>

        <div className="border-border/60 flex items-center justify-between border-t pt-3">
          <CopyAddress address={agent.wallet} />
          <Link
            to="/agents/$agentId"
            params={{ agentId: agent.agentId }}
            className="text-primary text-xs hover:underline"
          >
            Open dossier →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data: agents, isLoading, error } = useAgents();

  return (
    <>
      <PageHeader
        title="Agent Registry"
        subtitle="Every agent governed by the Agent Constitution contract, with its live compliance standing."
        action={<RegisterAgentDialog />}
      />

      {isLoading ? <LoadingState label="Reading the agent registry…" /> : null}
      {error ? <ErrorState error={error} /> : null}

      {agents && agents.length === 0 ? (
        <EmptyState
          title="No agents registered yet"
          description="The contract has no agents on this network. Register your first agent and ratify its constitution to begin adjudicating actions."
          action={<RegisterAgentDialog />}
        />
      ) : null}

      {agents && agents.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.agentId} agent={agent} />
          ))}
        </div>
      ) : null}
    </>
  );
}
