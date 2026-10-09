import { BadgeCheck, FileWarning, Gauge, Scale, Sparkles } from "lucide-react";

import { SeverityBadge, VerdictBadge } from "@/components/app/badges";
import { Card, CardContent } from "@/components/ui/card";
import type { Verdict } from "@/lib/genlayer/types";

export function VerdictCard({ verdict }: { verdict: Verdict }) {
  return (
    <Card className="panel">
      <CardContent className="space-y-5 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <VerdictBadge status={verdict.status} />
          <SeverityBadge severity={verdict.severity} />
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <Gauge className="size-3.5" /> Confidence: {verdict.confidence}
          </span>
          <span className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-xs">
            <Scale className="size-3.5" /> {verdict.governingRuleId}
          </span>
          <span
            className={`ml-auto text-xs font-semibold tracking-wider uppercase ${
              verdict.approved ? "text-compliant" : "text-violation"
            }`}
          >
            {verdict.approved ? "Approved" : "Blocked"}
          </span>
        </div>

        <Field icon={<BadgeCheck className="size-4" />} label="Adjudicator explanation">
          {verdict.explanation}
        </Field>
        <Field icon={<FileWarning className="size-4" />} label="Untrusted evidence notes">
          {verdict.untrustedEvidenceNotes}
        </Field>
        <Field icon={<Sparkles className="size-4" />} label="Recommended action">
          {verdict.recommendedAction}
        </Field>
      </CardContent>
    </Card>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border/60 rounded-md border p-3">
      <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-[11px] tracking-widest uppercase">
        {icon}
        {label}
      </div>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}
