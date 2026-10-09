import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileSignature, History } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AgentPicker, useSelectedAgent } from "@/components/app/AgentPicker";
import { PageHeader } from "@/components/app/AppShell";
import { Pill, SeverityBadge } from "@/components/app/badges";
import { RuleEditor } from "@/components/app/RegisterAgentDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage, useAgent, useConstitution } from "@/lib/genlayer/hooks";
import { useGenLayer } from "@/lib/genlayer/provider";
import type { ConstitutionRule } from "@/lib/genlayer/types";

export const Route = createFileRoute("/constitution")({
  head: () => ({
    meta: [
      { title: "Constitution Studio — Agent Constitution on GenLayer" },
      {
        name: "description",
        content:
          "Read, version and amend the on-chain constitution that governs each autonomous agent.",
      },
      { property: "og:title", content: "Constitution Studio — Agent Constitution on GenLayer" },
      {
        property: "og:description",
        content: "Read, version and amend an agent's on-chain constitution.",
      },
    ],
  }),
  component: ConstitutionStudio,
});

function AmendDialog({ agentId, rules }: { agentId: string; rules: ConstitutionRule[] }) {
  const { client } = useGenLayer();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [draft, setDraft] = useState<ConstitutionRule[]>(rules);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(rules.map((r) => ({ ...r, parameters: { ...r.parameters } })));
      setConfirmed(false);
      setReason("");
    }
  }, [open, rules]);

  const { data: agentInfo } = useAgent(agentId);
  const mutation = useMutation({
    mutationFn: () => client.amendConstitution({ agentId, mission: agentInfo?.mission ?? "", reason, rules: draft }),
    onSuccess: (c) => {
      toast.success(`Amendment ratified${typeof c === "number" ? ` — now at version ${c}` : ""}`);
      void queryClient.invalidateQueries();
      setOpen(false);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={!agentId}>
          <FileSignature className="size-4" /> Amend constitution
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Constitutional amendment</DialogTitle>
          <DialogDescription>
            Amendments are signed by the owner and recorded as a new version on-chain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Owner reason (required)</Label>
          <Textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why this amendment is necessary."
          />
        </div>

        <RuleEditor rules={draft} onChange={setDraft} />

        <label className="text-muted-foreground flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="accent-primary size-4"
          />
          I understand this replaces the governing rule set for every future action.
        </label>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!reason.trim() || !confirmed || draft.length === 0 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Ratifying…" : "Ratify amendment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConstitutionStudio() {
  const { agentId } = useSelectedAgent();
  const { data: constitution, isLoading, error } = useConstitution(agentId);

  return (
    <>
      <PageHeader
        title="Constitution Studio"
        subtitle="The governing document each agent is adjudicated against, versioned on-chain."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AgentPicker />
            {constitution ? <AmendDialog agentId={agentId} rules={constitution.rules} /> : null}
          </div>
        }
      />

      {!agentId ? (
        <EmptyState
          title="Select an agent"
          description="Choose a registered agent to read its constitution. If the registry is empty, register an agent first."
        />
      ) : null}

      {agentId && isLoading ? <LoadingState label="Fetching the constitution…" /> : null}
      {error ? <ErrorState error={error} /> : null}

      {constitution ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card className="panel">
              <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle className="font-display text-base">Preamble</CardTitle>
                <Pill>Version {constitution.version}</Pill>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed italic">{constitution.preamble}</p>
              </CardContent>
            </Card>

            {constitution.rules.map((rule) => (
              <Card key={rule.id} className="panel">
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle className="font-display text-base">{rule.article}</CardTitle>
                    <p className="text-muted-foreground font-mono text-xs">{rule.id}</p>
                  </div>
                  <SeverityBadge severity={rule.severity} />
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed">{rule.text}</p>
                  {Object.keys(rule.parameters ?? {}).length ? (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(rule.parameters).map(([k, v]) => (
                        <div key={k} className="border-border/60 bg-muted/30 rounded-md border px-3 py-1.5">
                          <div className="text-muted-foreground text-[10px] tracking-widest uppercase">
                            {k}
                          </div>
                          <div className="font-mono text-sm">{v}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="panel h-fit">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2 text-base">
                <History className="size-4" /> Version history
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {constitution.history?.length ? (
                constitution.history.map((h) => (
                  <div key={h.version} className="border-border/60 border-l-2 pl-3">
                    <div className="flex items-center gap-2">
                      <Pill>v{h.version}</Pill>
                      <span className="text-muted-foreground text-xs">
                        {h.ruleCount} rules
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{h.reason}</p>
                    <p className="text-muted-foreground text-xs">{h.ruleCount} rules</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No amendments recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
