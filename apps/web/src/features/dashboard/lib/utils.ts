import { SupportedBlockchain } from '@/types/global';
import ethAbi from '../lib/eth/buffcat.json';
import baseAbi from '../lib/base/buffcat.json';

const floatPattern = /^\d+(\.\d+)?$/;

export function isValidFloat(s: string) {
  return floatPattern.test(s.trim());
}

export function getEvmAbi(chain: SupportedBlockchain) {
  if (chain === 'eth') return ethAbi.abi;
  else return baseAbi.abi;
}
