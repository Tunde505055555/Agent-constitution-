import { Check, Copy, ExternalLink, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { explorerLink, shortAddress } from "@/lib/genlayer/networks";
import { useGenLayer } from "@/lib/genlayer/provider";
import type { AgentStatus, Severity, VerdictStatus } from "@/lib/genlayer/types";

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase";

export function SeverityBadge({ severity }: { severity: Severity }) {
  const tone: Record<Severity, string> = {
    NONE: "border-border bg-muted/40 text-muted-foreground",
    LOW: "border-info/40 bg-info/10 text-info",
    MEDIUM: "border-warning/40 bg-warning/10 text-warning",
    HIGH: "border-violation/40 bg-violation/10 text-violation",
    CRITICAL: "border-critical/50 bg-critical/15 text-critical",
  };
  return <span className={cn(base, tone[severity])}>{severity}</span>;
}

export function VerdictBadge({ status }: { status: VerdictStatus }) {
  const tone: Record<VerdictStatus, string> = {
    COMPLIANT: "border-compliant/40 bg-compliant/10 text-compliant",
    WARNING: "border-warning/40 bg-warning/10 text-warning",
    VIOLATION: "border-violation/40 bg-violation/10 text-violation",
  };
  const Icon =
    status === "COMPLIANT" ? ShieldCheck : status === "WARNING" ? TriangleAlert : ShieldAlert;
  return (
    <span className={cn(base, tone[status])}>
      <Icon className="size-3.5" />
      {status}
    </span>
  );
}

export function StatusBadge({ status }: { status: AgentStatus }) {
  return (
    <span
      className={cn(
        base,
        status === "ACTIVE"
          ? "border-compliant/40 bg-compliant/10 text-compliant"
          : "border-violation/40 bg-violation/10 text-violation",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "ACTIVE" ? "bg-compliant animate-pulse" : "bg-violation",
        )}
      />
      {status}
    </span>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn(base, "border-border bg-muted/40 text-muted-foreground", className)}>{children}</span>;
}

export function CopyAddress({
  address,
  link = false,
  className,
}: {
  address: string;
  link?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const { network } = useGenLayer();
  const href = link ? explorerLink(network, address) : undefined;

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono text-xs", className)}>
      <span className="text-muted-foreground">{shortAddress(address)}</span>
      <button
        type="button"
        aria-label="Copy address"
        className="text-muted-foreground hover:text-accent transition-colors"
        onClick={() => {
          void navigator.clipboard.writeText(address);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="size-3.5 text-compliant" /> : <Copy className="size-3.5" />}
      </button>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label="Open in explorer"
          className="text-muted-foreground hover:text-accent transition-colors"
        >
          <ExternalLink className="size-3.5" />
        </a>
      ) : null}
    </span>
  );
}

export function ScoreGauge({ score, label = "Compliance" }: { score: number; label?: string }) {
  const tone = score >= 80 ? "text-compliant" : score >= 50 ? "text-warning" : "text-violation";
  const stroke = score >= 80 ? "var(--compliant)" : score >= 50 ? "var(--warning)" : "var(--violation)";
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-28 place-items-center">
      <svg viewBox="0 0 100 100" className="size-28 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * c} ${c}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <div className={cn("text-2xl font-semibold tabular-nums", tone)}>{score}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
