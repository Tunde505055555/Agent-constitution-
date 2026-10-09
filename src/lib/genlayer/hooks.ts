import { useQuery } from "@tanstack/react-query";

import { useGenLayer, useScope } from "./provider";

export function useAgents() {
  const { client } = useGenLayer();
  const scope = useScope();
  return useQuery({ queryKey: [scope, "agents"], queryFn: () => client.listAgents() });
}

export function useAgent(agentId: string) {
  const { client } = useGenLayer();
  const scope = useScope();
  return useQuery({
    queryKey: [scope, "agent", agentId],
    queryFn: () => client.getAgent(agentId),
    enabled: Boolean(agentId),
  });
}

export function useAgentScore(agentId: string) {
  const { client } = useGenLayer();
  const scope = useScope();
  return useQuery({
    queryKey: [scope, "score", agentId],
    queryFn: () => client.agentScore(agentId),
    enabled: Boolean(agentId),
  });
}

export function useConstitution(agentId: string) {
  const { client } = useGenLayer();
  const scope = useScope();
  return useQuery({
    queryKey: [scope, "constitution", agentId],
    queryFn: () => client.getConstitution(agentId),
    enabled: Boolean(agentId),
  });
}

export function useActions(agentId?: string) {
  const { client } = useGenLayer();
  const scope = useScope();
  return useQuery({
    queryKey: [scope, "actions", agentId ?? "all"],
    queryFn: () => client.getActions(agentId),
  });
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
