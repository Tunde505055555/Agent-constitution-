import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/genlayer/hooks";
import { CONSTITUTION_TEMPLATES } from "@/lib/genlayer/presets";
import { useGenLayer } from "@/lib/genlayer/provider";
import type { ConstitutionRule, Severity } from "@/lib/genlayer/types";

const SEVERITIES: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function RuleEditor({
  rules,
  onChange,
}: {
  rules: ConstitutionRule[];
  onChange: (rules: ConstitutionRule[]) => void;
}) {
  const set = (i: number, patch: Partial<ConstitutionRule>) =>
    onChange(rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-3">
      {rules.map((rule, i) => (
        <div key={i} className="border-border/70 space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={rule.id}
              onChange={(e) => set(i, { id: e.target.value })}
              className="w-24 font-mono text-xs"
              placeholder="R-1"
            />
            <Input
              value={rule.article}
              onChange={(e) => set(i, { article: e.target.value })}
              className="min-w-[10rem] flex-1"
              placeholder="Article I — Capital Preservation"
            />
            <Select value={rule.severity} onValueChange={(v) => set(i, { severity: v as Severity })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(rules.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="text-violation size-4" />
            </Button>
          </div>
          <Textarea
            value={rule.text}
            onChange={(e) => set(i, { text: e.target.value })}
            placeholder="The rule as the adjudicator should read it."
            rows={2}
          />
          <Input
            value={Object.entries(rule.parameters)
              .map(([k, v]) => `${k}=${v}`)
              .join(", ")}
            onChange={(e) =>
              set(i, {
                parameters: Object.fromEntries(
                  e.target.value
                    .split(",")
                    .map((pair) => pair.split("="))
                    .filter((p) => p[0]?.trim())
                    .map((p) => [p[0]!.trim(), (p[1] ?? "").trim()]),
                ),
              })
            }
            placeholder="parameters, e.g. max_trade_gen=250, max_slippage_bps=75"
            className="font-mono text-xs"
          />
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="gap-2"
        onClick={() =>
          onChange([
            ...rules,
            {
              id: `R-${rules.length + 1}`,
              article: `Article ${rules.length + 1}`,
              text: "",
              severity: "MEDIUM",
              parameters: {},
            },
          ])
        }
      >
        <Plus className="size-4" /> Add rule
      </Button>
    </div>
  );
}

export function RegisterAgentDialog() {
  const { client } = useGenLayer();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [name, setName] = useState("");
  const [mission, setMission] = useState("");
  const [wallet, setWallet] = useState("");
  const [preamble, setPreamble] = useState("");
  const [rules, setRules] = useState<ConstitutionRule[]>([]);

  const applyTemplate = (id: string) => {
    const t = CONSTITUTION_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setPreamble(t.preamble);
    setRules(t.rules.map((r) => ({ ...r, parameters: { ...r.parameters } })));
  };

  const mutation = useMutation({
    mutationFn: () => client.registerAgent({ agentId, name, mission, wallet, preamble, rules }),
    onSuccess: (agent) => {
      toast.success(`${agent.name} registered under its constitution`);
      void queryClient.invalidateQueries();
      setOpen(false);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="size-4" /> Register agent
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Register a new agent</DialogTitle>
          <DialogDescription>
            The constitution is ratified at genesis and governs every action the agent submits.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Agent ID</Label>
            <Input value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="atlas-trader" />
          </div>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Atlas Trader" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Mission</Label>
            <Textarea
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              rows={2}
              placeholder="What the agent exists to do."
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Wallet address</Label>
            <Input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x…"
              className="font-mono text-xs"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label className="font-display text-sm">Constitution builder</Label>
            <Select onValueChange={applyTemplate}>
              <SelectTrigger className="w-[15rem]">
                <SelectValue placeholder="Start from a template" />
              </SelectTrigger>
              <SelectContent>
                {CONSTITUTION_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={preamble}
            onChange={(e) => setPreamble(e.target.value)}
            rows={2}
            placeholder="Preamble — the agent's highest duty."
          />
          <RuleEditor rules={rules} onChange={setRules} />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!agentId || !name || rules.length === 0 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Ratifying…" : "Register & ratify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
