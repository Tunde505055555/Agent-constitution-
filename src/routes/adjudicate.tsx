import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AgentPicker, useSelectedAgent } from "@/components/app/AgentPicker";
import { PageHeader } from "@/components/app/AppShell";
import { EmptyState } from "@/components/app/states";
import { VerdictCard } from "@/components/app/VerdictCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/genlayer/hooks";
import { useGenLayer } from "@/lib/genlayer/provider";
import type { ActionInput, Verdict } from "@/lib/genlayer/types";

export const Route = createFileRoute("/adjudicate")({
  head: () => ({
    meta: [
      { title: "Action Adjudication — Agent Constitution on GenLayer" },
      {
        name: "description",
        content:
          "Submit agent actions for on-chain adjudication or dry-run them against the constitution before committing state.",
      },
      { property: "og:title", content: "Action Adjudication — Agent Constitution on GenLayer" },
      {
        property: "og:description",
        content: "Submit or dry-run agent actions against the governing constitution.",
      },
    ],
  }),
  component: Adjudicate,
});

const EMPTY = {
  actionId: "",
  kind: "transfer",
  description: "",
  amount: "",
  counterparty: "",
  evidence: "",
  humanApproval: false,
};

function Adjudicate() {
  const { agentId } = useSelectedAgent();
  const { client } = useGenLayer();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [verdictTitle, setVerdictTitle] = useState("Verdict");

  const payload = (): ActionInput => ({ agentId, ...form });
  const set = (patch: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...patch }));

  const simulate = useMutation({
    mutationFn: () => client.simulateAction(payload()),
    onSuccess: (v) => {
      setVerdictTitle("Dry-run verdict (no state committed)");
      setVerdict(v);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const submit = useMutation({
    mutationFn: () => client.submitAction(payload()),
    onSuccess: (record) => {
      setVerdictTitle("Adjudicated verdict (recorded on-chain)");
      setVerdict(record.verdict);
      void queryClient.invalidateQueries();
      toast.success(`Action ${record.actionId} adjudicated`);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const ready = Boolean(agentId && form.actionId && form.description);

  return (
    <>
      <PageHeader
        title="Action Adjudication"
        subtitle="Put a proposed action in front of the constitution — as a dry run, or for the record."
        action={<AgentPicker />}
      />

      {!agentId ? (
        <EmptyState
          title="Select an agent"
          description="Actions are adjudicated against a specific agent's constitution. Register an agent first if the registry is empty."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="panel">
            <CardHeader>
              <CardTitle className="font-display text-base">Action details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Action ID</Label>
                  <Input
                    value={form.actionId}
                    onChange={(e) => set({ actionId: e.target.value })}
                    placeholder="act-1042"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Kind</Label>
                  <Input
                    value={form.kind}
                    onChange={(e) => set({ kind: e.target.value })}
                    placeholder="transfer, swap, moderation…"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="What the agent intends to do, and why."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Amount (GEN)</Label>
                  <Input
                    value={form.amount}
                    onChange={(e) => set({ amount: e.target.value })}
                    placeholder="0"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Counterparty</Label>
                  <Input
                    value={form.counterparty}
                    onChange={(e) => set({ counterparty: e.target.value })}
                    placeholder="0x… or a domain"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Evidence links / notes</Label>
                <Textarea
                  rows={3}
                  value={form.evidence}
                  onChange={(e) => set({ evidence: e.target.value })}
                  placeholder="One link or note per line — the contract fetches links and treats them as untrusted evidence."
                />
              </div>
              <div className="border-border/60 flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="text-sm">Human approval attached</Label>
                  <p className="text-muted-foreground text-xs">
                    Records that an owner signed off before submission.
                  </p>
                </div>
                <Switch
                  checked={form.humanApproval}
                  onCheckedChange={(v) => set({ humanApproval: v })}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  className="gap-2"
                  disabled={!ready || simulate.isPending}
                  onClick={() => simulate.mutate()}
                >
                  <FlaskConical className="size-4" />
                  {simulate.isPending ? "Simulating…" : "Dry-run simulation"}
                </Button>
                <Button
                  className="gap-2"
                  disabled={!ready || submit.isPending}
                  onClick={() => submit.mutate()}
                >
                  <Send className="size-4" />
                  {submit.isPending ? "Submitting…" : "Submit for adjudication"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="panel">
            <CardHeader>
              <CardTitle className="font-display text-base">Latest verdict</CardTitle>
            </CardHeader>
            <CardContent>
              {verdict ? (
                <VerdictCard verdict={verdict} />
              ) : (
                <p className="text-muted-foreground py-12 text-center text-sm">
                  Run a simulation or submit an action to see the consensus verdict here.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={Boolean(verdict)} onOpenChange={(o) => !o && setVerdict(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{verdictTitle}</DialogTitle>
          </DialogHeader>
          {verdict ? <VerdictCard verdict={verdict} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
