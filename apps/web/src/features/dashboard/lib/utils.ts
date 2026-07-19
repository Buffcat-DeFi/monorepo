const floatPattern = /^\d+(\.\d+)?$/;

export function isValidFloat(s: string) {
  return floatPattern.test(s.trim());
}
