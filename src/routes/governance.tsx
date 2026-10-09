import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Gavel, Lock, ShieldAlert, Unlock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AgentPicker, useSelectedAgent } from "@/components/app/AgentPicker";
import { PageHeader } from "@/components/app/AppShell";
import { Pill, SeverityBadge, StatusBadge, VerdictBadge } from "@/components/app/badges";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage, useActions, useAgent } from "@/lib/genlayer/hooks";
import { useGenLayer } from "@/lib/genlayer/provider";

export const Route = createFileRoute("/governance")({
  head: () => ({
    meta: [
      { title: "Appeals & Emergency Governance — Agent Constitution" },
      {
        name: "description",
        content:
          "File appeals against verdicts, track upheld or overturned rulings, and freeze or unfreeze agents with audited review notes.",
      },
      { property: "og:title", content: "Appeals & Emergency Governance — Agent Constitution" },
      {
        property: "og:description",
        content: "Appeal verdicts and run emergency freeze controls with audited review notes.",
      },
    ],
  }),
  component: Governance,
});

function Governance() {
  const { agentId } = useSelectedAgent();
  const { client } = useGenLayer();
  const queryClient = useQueryClient();
  const { data: agent, isLoading, error } = useAgent(agentId);
  const { data: actions } = useActions(agentId || undefined);

  const [actionId, setActionId] = useState("");
  const [statement, setStatement] = useState("");
  const [newEvidence, setNewEvidence] = useState("");
  const [freezeReason, setFreezeReason] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const appealable = (actions ?? []).filter((a) => a.verdict.status !== "COMPLIANT" && !a.appeal);

  const appeal = useMutation({
    mutationFn: () => client.appealVerdict({ agentId, actionId, statement, newEvidence }),
    onSuccess: (result) => {
      toast.success(result?.status ? `Appeal ${String(result.status).toLowerCase()}` : "Appeal submitted");
      void queryClient.invalidateQueries();
      setStatement("");
      setNewEvidence("");
      setActionId("");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const freeze = useMutation({
    mutationFn: () => client.freezeAgent({ agentId, reason: freezeReason }),
    onSuccess: () => {
      toast.success("Agent frozen");
      void queryClient.invalidateQueries();
      setFreezeReason("");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const unfreeze = useMutation({
    mutationFn: () => client.unfreezeAgent({ agentId, reviewNotes }),
    onSuccess: () => {
      toast.success("Agent reinstated");
      void queryClient.invalidateQueries();
      setReviewNotes("");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <>
      <PageHeader
        title="Appeals & Emergency Governance"
        subtitle="Challenge a verdict with new evidence, or halt an agent outright when something goes wrong."
        action={<AgentPicker />}
      />

      {!agentId ? (
        <EmptyState
          title="Select an agent"
          description="Appeals and freeze controls apply to a specific registered agent."
        />
      ) : null}

      {agentId && isLoading ? <LoadingState label="Loading governance state…" /> : null}
      {error ? <ErrorState error={error} /> : null}

      {agent ? (
        <>
          {agent.status === "FROZEN" && agent.freezeReason ? (
            <Alert variant="destructive" className="mb-5">
              <ShieldAlert className="size-4" />
              <AlertTitle>{agent.name} is frozen</AlertTitle>
              <AlertDescription>{agent.freezeReason}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="panel">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2 text-base">
                  <Gavel className="size-4" /> File an appeal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Adjudicated action</Label>
                  <Select value={actionId} onValueChange={setActionId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose an action to appeal" />
                    </SelectTrigger>
                    <SelectContent>
                      {appealable.map((a) => (
                        <SelectItem key={a.actionId} value={a.actionId}>
                          {a.actionId} · {a.verdict.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {appealable.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      No open verdicts are eligible for appeal right now.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <Label>Owner statement</Label>
                  <Textarea
                    rows={4}
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    placeholder="Why the original verdict misread the constitution."
                  />
                </div>
                <div className="space-y-1">
                  <Label>New corroborating evidence</Label>
                  <Textarea
                    rows={3}
                    value={newEvidence}
                    onChange={(e) => setNewEvidence(e.target.value)}
                    placeholder="One link or note per line — links are fetched and reviewed by the appeal adjudicator."
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={!actionId || !statement.trim() || appeal.isPending}
                  onClick={() => appeal.mutate()}
                >
                  {appeal.isPending ? "Submitting appeal…" : "Submit appeal"}
                </Button>
              </CardContent>
            </Card>

            <Card className="panel">
              <CardHeader>
                <CardTitle className="font-display flex items-center justify-between gap-2 text-base">
                  <span className="flex items-center gap-2">
                    <Lock className="size-4" /> Emergency controls
                  </span>
                  <StatusBadge status={agent.status} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {agent.status === "ACTIVE" ? (
                  <>
                    <div className="space-y-1">
                      <Label>Freeze reason (recorded on-chain)</Label>
                      <Textarea
                        rows={4}
                        value={freezeReason}
                        onChange={(e) => setFreezeReason(e.target.value)}
                        placeholder="What triggered the emergency halt."
                      />
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      disabled={!freezeReason.trim() || freeze.isPending}
                      onClick={() => freeze.mutate()}
                    >
                      <Lock className="size-4" />
                      {freeze.isPending ? "Freezing…" : "Freeze agent"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <Label>Audit review notes (required)</Label>
                      <Textarea
                        rows={4}
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="What was reviewed and remediated before reinstatement."
                      />
                    </div>
                    <Button
                      className="w-full gap-2"
                      disabled={!reviewNotes.trim() || unfreeze.isPending}
                      onClick={() => unfreeze.mutate()}
                    >
                      <Unlock className="size-4" />
                      {unfreeze.isPending ? "Reinstating…" : "Unfreeze agent"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="panel mt-5">
            <CardHeader>
              <CardTitle className="font-display text-base">Appeal tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(actions ?? []).filter((a) => a.appeal).length ? (
                (actions ?? [])
                  .filter((a) => a.appeal)
                  .map((a) => (
                    <div key={a.actionId} className="border-border/60 rounded-md border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs">{a.actionId}</span>
                        <VerdictBadge status={a.verdict.status} />
                        <SeverityBadge severity={a.verdict.severity} />
                        <Pill>{a.appeal!.status}</Pill>
                      </div>
                      <p className="mt-2 text-sm">{a.appeal!.statement}</p>
                      <p className="text-muted-foreground mt-1 text-sm">{a.appeal!.ruling}</p>
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground text-sm">No appeals have been filed yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </>
  );
}
