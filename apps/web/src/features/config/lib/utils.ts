// ─── CSV Download ─────────────────────────────────────────────────────────────

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── CSV Parsers ──────────────────────────────────────────────────────────────

export function parseAddressCsv(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim().split(',')[0].trim())
    .filter((addr) => addr.startsWith('0x') && addr.length === 42);
}

export function parsePoolsCsv(
  text: string,
): { token: string; pool: string; pairedToken: string }[] {
  return text
    .split('\n')
    .map((l) => {
      const [token, pool, pairedToken] = l.split(',').map((x) => x.trim());
      return { token, pool, pairedToken };
    })
    .filter(
      ({ token, pool, pairedToken }) =>
        token?.startsWith('0x') && pool?.startsWith('0x') && pairedToken?.startsWith('0x'),
    );
}

export function parseFeedsCsv(text: string): { token: string; feed: string }[] {
  return text
    .split('\n')
    .map((l) => {
      const [token, feed] = l.split(',').map((x) => x.trim());
      return { token, feed };
    })
    .filter(({ token, feed }) => token?.startsWith('0x') && feed?.startsWith('0x'));
}
