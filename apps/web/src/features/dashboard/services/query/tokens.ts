import { Blockchain, CoinGeckoToken } from '@/types/global';

export async function getTokensList(blockchain: Blockchain): Promise<CoinGeckoToken[]> {
  try {
    const url = `https://tokens.coingecko.com/${blockchain.name.toLowerCase()}/all.json`;
    const res = await fetch(url);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.tokens;
  } catch (error) {
    console.log(`Error fetching token list for ${blockchain.name}`);
    console.log(error);
    return [];
  }
}
