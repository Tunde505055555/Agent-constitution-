import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function LoadingState({ label = "Reading the contract…" }: { label?: string }) {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="bg-muted/60 text-muted-foreground grid size-12 place-items-center rounded-full">
        <Inbox className="size-6" />
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-md text-sm">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <Alert variant="destructive" className="my-6">
      <AlertTriangle className="size-4" />
      <AlertTitle>Contract call failed</AlertTitle>
      <AlertDescription className="text-sm">{message}</AlertDescription>
    </Alert>
  );
}
