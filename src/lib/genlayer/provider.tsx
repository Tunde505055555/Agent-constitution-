import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { STUDIO_DEV, type NetworkPreset } from "./networks";
import { createLiveClient } from "./rpc";
import type { ConstitutionClient } from "./types";

const STORAGE_KEY = "agent-constitution-settings";

export interface Settings {
  account: string;
  selectedAgent: string;
}

const DEFAULTS: Settings = {
  account: "",
  selectedAgent: "",
};

interface Ctx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  network: NetworkPreset;
  client: ConstitutionClient;
  canSign: boolean;
}

const GenLayerContext = createContext<Ctx | undefined>(undefined);

export function GenLayerProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Settings>;
        setSettings({
          account: typeof saved.account === "string" ? saved.account : "",
          selectedAgent: typeof saved.selectedAgent === "string" ? saved.selectedAgent : "",
        });
      }
    } catch {
      /* ignore unreadable storage */
    }
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(() => {
    const network = STUDIO_DEV;
    const client = createLiveClient({
      rpcUrl: network.rpcUrl,
      chainId: network.chainId,
      ...(settings.account ? { account: settings.account } : {}),
    });
    return {
      settings,
      update,
      network,
      client,
      canSign: Boolean(settings.account),
    };
  }, [settings, update]);

  return <GenLayerContext.Provider value={value}>{children}</GenLayerContext.Provider>;
}

export function useGenLayer() {
  const ctx = useContext(GenLayerContext);
  if (!ctx) throw new Error("useGenLayer must be used inside GenLayerProvider");
  return ctx;
}

/** Namespaces query keys so switching network refetches everything. */
export function useScope() {
  const { network } = useGenLayer();
  return `${network.rpcUrl}:${network.chainId}`;
}
