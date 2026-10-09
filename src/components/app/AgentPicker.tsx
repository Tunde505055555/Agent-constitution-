import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAgents } from "@/lib/genlayer/hooks";
import { useGenLayer } from "@/lib/genlayer/provider";

export function useSelectedAgent() {
  const { settings, update } = useGenLayer();
  return {
    agentId: settings.selectedAgent,
    setAgentId: (id: string) => update({ selectedAgent: id }),
  };
}

export function AgentPicker({
  className,
  allowAll,
}: {
  className?: string;
  allowAll?: boolean;
}) {
  const { agentId, setAgentId } = useSelectedAgent();
  const { data: agents = [] } = useAgents();

  return (
    <Select
      value={agentId || (allowAll ? "__all" : "")}
      onValueChange={(v) => setAgentId(v === "__all" ? "" : v)}
    >
      <SelectTrigger className={className ?? "w-[16rem]"}>
        <SelectValue placeholder="Select an agent" />
      </SelectTrigger>
      <SelectContent>
        {allowAll ? <SelectItem value="__all">All agents</SelectItem> : null}
        {agents.map((a) => (
          <SelectItem key={a.agentId} value={a.agentId}>
            {a.name} · {a.agentId}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
