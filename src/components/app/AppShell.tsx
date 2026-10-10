import { Link } from "@tanstack/react-router";
import {
  Activity,
  Brain,
  FlaskConical,
  Gavel,
  KeyRound,
  LayoutDashboard,
  Radio,
  ScrollText,
  ShieldHalf,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { CopyAddress } from "@/components/app/badges";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/networks";
import { useGenLayer } from "@/lib/genlayer/provider";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/constitution", label: "Constitution", icon: ScrollText },
  { to: "/adjudicate", label: "Adjudicate", icon: Gavel },
  { to: "/audit", label: "Audit Log", icon: Activity },
  { to: "/governance", label: "Governance", icon: ShieldHalf },
  { to: "/intelligence", label: "Intelligence", icon: Brain },
] as const;

function NetworkControls() {
  const { settings, update, network, canSign } = useGenLayer();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Radio className={canSign ? "size-4 text-compliant" : "size-4 text-warning"} />
          <span className="hidden sm:inline">{network.label}</span>
          <span className="text-muted-foreground hidden font-mono text-xs md:inline">
            #{network.chainId || "—"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] space-y-4">
        <div className="space-y-1">
          <h3 className="font-display text-sm font-semibold">Network & connection</h3>
          <p className="text-muted-foreground text-xs">
            Reads go straight to the selected RPC. Writes are signed by your connected wallet.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Network</Label>
          <p className="text-sm">{network.label} · {network.chainId}</p>
        </div>

        <p className="text-muted-foreground font-mono text-xs break-all">{network.rpcUrl}</p>

        <Separator />

        <div className="space-y-1">
          <Label className="text-xs">Contract (fixed)</Label>
          <div className="bg-muted/50 rounded-md px-3 py-2">
            <CopyAddress address={CONTRACT_ADDRESS} link />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs">Wallet</Label>
          {settings.account ? (
            <div className="space-y-2">
              <div className="bg-muted/50 flex items-center justify-between gap-2 rounded-md px-3 py-2">
                <span className="text-sm">Connected</span>
                <CopyAddress address={settings.account} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => update({ account: "" })}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="w-full gap-2"
              onClick={async () => {
                const eth = (
                  globalThis as { ethereum?: { request: (a: unknown) => Promise<string[]> } }
                ).ethereum;
                if (!eth) {
                  toast.error("MetaMask not detected. Install the MetaMask extension to connect.");
                  return;
                }
                try {
                  const accounts = await eth.request({ method: "eth_requestAccounts" });
                  if (accounts[0]) {
                    update({ account: accounts[0] });
                    toast.success("MetaMask connected");
                  }
                } catch {
                  toast.error("Wallet connection was rejected.");
                }
              }}
            >
              <Wallet className="size-4" /> Connect MetaMask
            </Button>
          )}
          <p className="text-muted-foreground text-xs">
            Transactions are sent from your connected MetaMask account. No keys are stored here.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { settings, network } = useGenLayer();

  return (
    <div className="grid-bg min-h-screen">
      <header className="border-border/70 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="bg-primary/15 text-primary ring-primary/30 grid size-9 place-items-center rounded-lg ring-1">
              <FlaskConical className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="font-display block text-sm font-semibold tracking-wide">
                Agent Constitution
              </span>
              <span className="text-muted-foreground block text-[10px] tracking-[0.2em] uppercase">
                GenLayer Intelligent Contract
              </span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/60 flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors"
                activeProps={{ className: "text-primary bg-primary/10" }}
                activeOptions={{ exact: to === "/" }}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {settings.account ? (
              <span className="text-muted-foreground hidden items-center gap-1.5 text-xs md:flex">
                <KeyRound className="size-3.5" />
                <CopyAddress address={settings.account} />
              </span>
            ) : null}
            <NetworkControls />
          </div>
        </div>

        <nav className="border-border/70 flex gap-1 overflow-x-auto border-t px-3 py-2 lg:hidden">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="text-muted-foreground flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs"
              activeProps={{ className: "text-primary bg-primary/10" }}
              activeOptions={{ exact: to === "/" }}
            >
              <Icon className="size-3.5" />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>

      <footer className="border-border/70 mt-12 border-t">
        <div className="text-muted-foreground mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs">
          <span className="flex items-center gap-2">
            Contract <CopyAddress address={CONTRACT_ADDRESS} link />
          </span>
          <span>All data is read live from the contract on {network.label}.</span>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
