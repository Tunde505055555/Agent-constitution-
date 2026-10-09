import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AgentPicker, useSelectedAgent } from "@/components/app/AgentPicker";
import { PageHeader } from "@/components/app/AppShell";
import { CopyAddress, Pill, SeverityBadge, VerdictBadge } from "@/components/app/badges";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { VerdictCard } from "@/components/app/VerdictCard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useActions } from "@/lib/genlayer/hooks";
import type { ActionRecord, Severity } from "@/lib/genlayer/types";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log — Agent Constitution on GenLayer" },
      {
        name: "description",
        content:
          "Searchable log of every adjudicated agent action, with severity filters and full verdict drill-down.",
      },
      { property: "og:title", content: "Audit Log — Agent Constitution on GenLayer" },
      {
        property: "og:description",
        content: "Every adjudicated action, searchable and filterable by severity.",
      },
    ],
  }),
  component: AuditLog,
});

const SEVERITIES: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function AuditLog() {
  const { agentId } = useSelectedAgent();
  const { data: actions, isLoading, error } = useActions(agentId || undefined);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("ALL");
  const [selected, setSelected] = useState<ActionRecord | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (actions ?? []).filter((a) => {
      if (severity !== "ALL" && a.verdict.severity !== severity) return false;
      if (!q) return true;
      return [a.actionId, a.kind, a.description, a.counterparty, a.verdict.governingRuleId]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [actions, query, severity]);

  return (
    <>
      <PageHeader
        title="Audit Log"
        subtitle="Every action the contract has adjudicated, in the order it was recorded."
        action={<AgentPicker allowAll />}
      />

      <Card className="panel mb-5">
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="min-w-[16rem] flex-1 space-y-1">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Action id, description, counterparty, rule…"
                className="pl-9"
              />
            </div>
          </div>
          <div className="w-44 space-y-1">
            <Label className="text-xs">Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All severities</SelectItem>
                {SEVERITIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? <LoadingState label="Reading adjudicated actions…" /> : null}
      {error ? <ErrorState error={error} /> : null}

      {actions && actions.length === 0 ? (
        <EmptyState
          title="No adjudicated actions yet"
          description="Once an agent submits its first action for adjudication, the verdict will be recorded here."
        />
      ) : null}

      {actions && actions.length > 0 && filtered.length === 0 ? (
        <EmptyState
          title="No actions match your filters"
          description="Try clearing the search text or selecting all severities."
        />
      ) : null}

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((a) => (
            <button
              key={a.actionId}
              type="button"
              onClick={() => setSelected(a)}
              className="panel hover:border-primary/50 w-full rounded-lg border p-4 text-left transition-colors"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs">{a.actionId}</span>
                <Pill>{a.kind}</Pill>
                <VerdictBadge status={a.verdict.status} />
                <SeverityBadge severity={a.verdict.severity} />
                <span className="text-muted-foreground ml-auto text-xs">
                  {a.amount ? `${a.amount} GEN` : ""}
                </span>
              </div>
              <p className="mt-2 text-sm">{a.description}</p>
              <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-4 text-xs">
                <span>{a.amount || "0"} GEN</span>
                <span>Rule {a.verdict.governingRuleId}</span>
                {a.appeal ? <Pill>Appeal {a.appeal.status}</Pill> : null}
              </div>
            </button>
          ))}
        </div>
      ) : null}

      <Sheet open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle className="font-display">{selected.actionId}</SheetTitle>
                <SheetDescription>{selected.description}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-8">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Agent" value={selected.agentId} />
                  <Field label="Kind" value={selected.kind} />
                  <Field label="Amount" value={`${selected.amount || "0"} GEN`} />
                  <Field
                    label="Human approval"
                    value={selected.humanApproval ? "Attached" : "None"}
                  />
                </div>
                {selected.counterparty ? (
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      Counterparty
                    </p>
                    <CopyAddress address={selected.counterparty} />
                  </div>
                ) : null}
                {selected.evidence ? (
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">Evidence</p>
                    <p className="text-sm break-words">{selected.evidence}</p>
                  </div>
                ) : null}
                <VerdictCard verdict={selected.verdict} />
                {selected.appeal ? (
                  <div className="border-border/60 space-y-1 rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Pill>Appeal {selected.appeal.status}</Pill>
                    </div>
                    {selected.appeal.statement ? <p className="text-sm">{selected.appeal.statement}</p> : null}
                    <p className="text-muted-foreground text-sm">{selected.appeal.ruling}</p>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
      <p className="text-sm break-words">{value}</p>
    </div>
  );
}
