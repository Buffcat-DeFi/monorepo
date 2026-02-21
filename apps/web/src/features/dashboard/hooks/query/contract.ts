import { Blockchain } from "@/types/global";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { ethers } from "ethers";
import { envVariables } from "@/lib/envVariables";

interface UseTokenBalanceParams {
  chain: Blockchain;
  tokenAddressOrMint: string;
}

export function useTokenDerivative(
  { chain, tokenAddressOrMint }: UseTokenBalanceParams,
  options?: UseQueryOptions<string, Error>
) {
  return useQuery<string, Error>({
    queryKey: ["tokenDerivative", chain, tokenAddressOrMint],
    enabled: !!chain && !!tokenAddressOrMint,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      switch (chain.name) {
        case "Ethereum":
        case "Base": {
          const rpcUrl =
            chain.name === "Ethereum"
              ? process.env.NEXT_PUBLIC_ETH_RPC_URL!
              : process.env.NEXT_PUBLIC_BASE_RPC_URL!;
          const provider = new ethers.JsonRpcProvider(rpcUrl);

          const abi = [
            "function tokenDerivatives(address token) view returns (address)",
          ];

          const buffcatContract =
            chain.id == "eth"
              ? envVariables.buffcatContract.eth
              : envVariables.buffcatContract.base;
          if (buffcatContract == "") {
            throw new Error("Buffcat contract address not set.");
          }

          const contract = new ethers.Contract(buffcatContract, abi, provider);

          console.log("Blockchain: ", chain.name);
          console.log("Buffcat Contract: ", buffcatContract);
          console.log("Token: ", tokenAddressOrMint);

          const tokenDerivative =
            await contract.tokenDerivatives(tokenAddressOrMint);
          return String(tokenDerivative);
        }

        default:
          throw new Error(`Unsupported chain: ${chain}`);
      }
    },
    ...options,
  });
}
