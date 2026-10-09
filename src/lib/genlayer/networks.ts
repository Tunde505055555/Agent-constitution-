export const CONTRACT_ADDRESS = "0x6270f106b3B7CCa85D305b7Afcdb98Be294dc207";

export interface NetworkPreset {
  id: string;
  label: string;
  rpcUrl: string;
  chainId: number;
  explorer?: string;
}

export const STUDIO_DEV: NetworkPreset = {
    id: "studio-dev",
    label: "GenLayer Studio Dev",
    rpcUrl: "https://studio-dev.genlayer.com/api",
    chainId: 61997,
    explorer: "https://studio-dev.genlayer.com",
};

export function explorerLink(network: NetworkPreset, address: string) {
  if (!network.explorer) return undefined;
  return `${network.explorer}/contracts/${address}`;
}

export function shortAddress(address: string, size = 6) {
  if (!address || address.length < size * 2 + 2) return address;
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}
