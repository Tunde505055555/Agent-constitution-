import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, BadgeCheck, HeartPulse, Radar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AgentPicker, useSelectedAgent } from "@/components/app/AgentPicker";
import { PageHeader } from "@/components/app/AppShell";
import { Pill, VerdictBadge } from "@/components/app/badges";
import { EmptyState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/genlayer/hooks";
import { DEFAULT_STRESS_SCENARIOS } from "@/lib/genlayer/presets";
import { useGenLayer } from "@/lib/genlayer/provider";
import type {
  BehavioralDrift,
  ConstitutionHealth,
  StressResult,
  StressScenario,
  TrustPassport,
} from "@/lib/genlayer/types";

export const Route = createFileRoute("/intelligence")({
  head: () => ({
    meta: [
      { title: "Governance Intelligence — Agent Constitution on GenLayer" },
      {
        name: "description",
        content:
          "Trust passports, behavioural drift radar, constitution health audits and multi-scenario stress tests for autonomous agents.",
      },
      { property: "og:title", content: "Governance Intelligence — Agent Constitution" },
      {
        property: "og:description",
        content: "Trust passports, drift radar, health audits and stress tests for your agents.",
      },
    ],
  }),
  component: Intelligence,
});

function Intelligence() {
  const { agentId } = useSelectedAgent();
  const { client } = useGenLayer();

  const [passport, setPassport] = useState<TrustPassport | null>(null);
  const [drift, setDrift] = useState<BehavioralDrift | null>(null);
  const [health, setHealth] = useState<ConstitutionHealth | null>(null);
  const [results, setResults] = useState<StressResult[] | null>(null);
  const [scenarioText, setScenarioText] = useState(
    DEFAULT_STRESS_SCENARIOS.map((s: StressScenario) => `${s.title} :: ${s.prompt}`).join("\n"),
  );

  const fail = (e: unknown) => toast.error(errorMessage(e));

  const passportRun = useMutation({
    mutationFn: () => client.trustPassport({ agentId, counterparty: agentId }),
    onSuccess: setPassport,
    onError: fail,
  });
  const driftRun = useMutation({
    mutationFn: () => client.behavioralDrift(agentId),
    onSuccess: setDrift,
    onError: fail,
  });
  const healthRun = useMutation({
    mutationFn: () => client.constitutionHealth(agentId),
    onSuccess: setHealth,
    onError: fail,
  });
  const stressRun = useMutation({
    mutationFn: () => {
      const scenarios: StressScenario[] = scenarioText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [title, prompt] = line.split("::");
          return { title: (title ?? line).trim(), prompt: (prompt ?? line).trim() };
        });
      return client.stressTest({ agentId, scenarios });
    },
    onSuccess: setResults,
    onError: fail,
  });

  if (!agentId) {
    return (
      <>
        <PageHeader
          title="Governance Intelligence"
          subtitle="Four diagnostics that read an agent's constitution and history before something goes wrong."
          action={<AgentPicker />}
        />
        <EmptyState
          title="Select an agent"
          description="Every diagnostic runs against a specific registered agent's constitution and action history."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Governance Intelligence"
        subtitle="Four diagnostics that read an agent's constitution and history before something goes wrong."
        action={<AgentPicker />}
      />

      <Tabs defaultValue="passport">
        <TabsList className="mb-5 flex-wrap">
          <TabsTrigger value="passport" className="gap-1.5">
            <BadgeCheck className="size-4" /> Trust Passport
          </TabsTrigger>
          <TabsTrigger value="drift" className="gap-1.5">
            <Radar className="size-4" /> Drift Radar
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-1.5">
            <HeartPulse className="size-4" /> Health Auditor
          </TabsTrigger>
          <TabsTrigger value="stress" className="gap-1.5">
            <Activity className="size-4" /> Stress Tester
          </TabsTrigger>
        </TabsList>

        <TabsContent value="passport">
          <Card className="panel">
            <CardHeader>
              <CardTitle className="font-display text-base">Agent trust passport</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted-foreground text-sm">
                  The contract reviews this agent's record and recommends how much GEN others should trust it with.
                </p>
                <Button disabled={passportRun.isPending} onClick={() => passportRun.mutate()}>
                  {passportRun.isPending ? "Assessing…" : "Issue trust passport"}
                </Button>
              </div>

              {passport ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill>Risk {passport.risk}</Pill>
                    <Pill>Limit {passport.limit}</Pill>
                    <Pill>{passport.limitGen} GEN cap</Pill>
                  </div>
                  <p className="text-sm">{passport.summary}</p>
                  <ul className="space-y-1">
                    {passport.signals.map((s) => (
                      <li key={s} className="text-muted-foreground text-sm">
                        • {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Run the assessment to receive a risk rating and recommended interaction limit.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drift">
          <Card className="panel">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardTitle className="font-display text-base">Behavioural drift radar</CardTitle>
              <Button
                variant="secondary"
                disabled={driftRun.isPending}
                onClick={() => driftRun.mutate()}
              >
                {driftRun.isPending ? "Scanning…" : "Run drift scan"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {drift ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Drift from genesis mission</span>
                      <span className="tabular-nums">{drift.driftScore}/100</span>
                    </div>
                    <Progress value={drift.driftScore} />
                  </div>
                  <p className="text-sm">{drift.verdict}</p>
                  {drift.genesisMission ? (
                    <p className="text-muted-foreground text-sm italic">"{drift.genesisMission}"</p>
                  ) : null}
                  <div className="space-y-2">
                    {drift.signals.map((s) => (
                      <div key={s.label} className="border-border/60 rounded-md border p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{s.label}</span>
                          {s.weight ? (
                            <span className="text-muted-foreground text-xs tabular-nums">
                              weight {s.weight}
                            </span>
                          ) : null}
                        </div>
                        {s.detail ? <p className="text-muted-foreground mt-1 text-sm">{s.detail}</p> : null}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Run a scan to compare recent behaviour against the genesis mission.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card className="panel">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardTitle className="font-display text-base">Constitution health auditor</CardTitle>
              <Button
                variant="secondary"
                disabled={healthRun.isPending}
                onClick={() => healthRun.mutate()}
              >
                {healthRun.isPending ? "Auditing…" : "Run audit"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {health ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill>Band {health.band}</Pill>
                    <Pill>Score {health.score}/100</Pill>
                  </div>
                  <p className="text-sm">{health.summary}</p>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Findings title="Ambiguities" items={health.ambiguities} />
                    <Findings title="Contradictions" items={health.contradictions} />
                    <Findings title="Suggestions" items={health.suggestions} />
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Run an audit for a governance-lawyer review of the current rule set.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stress">
          <Card className="panel">
            <CardHeader>
              <CardTitle className="font-display text-base">Constitution stress tester</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Scenarios — one per line, as "Title :: prompt"</Label>
                <Textarea
                  rows={6}
                  value={scenarioText}
                  onChange={(e) => setScenarioText(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              <Button disabled={stressRun.isPending} onClick={() => stressRun.mutate()}>
                {stressRun.isPending ? "Running scenarios…" : "Run stress test"}
              </Button>

              {results?.length ? (
                <div className="space-y-2">
                  {results.map((r) => (
                    <div key={r.title} className="border-border/60 rounded-md border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{r.title}</span>
                        <VerdictBadge status={r.outcome} />
                        <span className="text-muted-foreground font-mono text-xs">
                          {r.governingRuleId}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">{r.prompt}</p>
                      <p className="mt-1 text-sm">{r.notes}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Findings({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border-border/60 rounded-md border p-3">
      <h3 className="font-display mb-2 text-sm font-semibold">{title}</h3>
      {items.length ? (
        <ul className="space-y-1">
          {items.map((i) => (
            <li key={i} className="text-muted-foreground text-sm">
              • {i}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">None found.</p>
      )}
    </div>
  );
}
