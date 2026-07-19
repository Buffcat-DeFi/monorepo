'use client';

import { useRef } from 'react';
import { Upload } from 'lucide-react';

// ─── CSV Upload Panel ─────────────────────────────────────────────────────────

interface CsvUploadPanelProps {
  label: string;
  hint: string;
  onParsed: (text: string) => void;
  preview: React.ReactNode;
}

export function CsvUploadPanel({ label, hint, onParsed, preview }: CsvUploadPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      onParsed(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => fileRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-custom-primary-color/40
          rounded-xl p-6 cursor-pointer hover:border-custom-primary-color hover:bg-black/5 transition-all"
      >
        <Upload className="w-6 h-6 text-custom-muted-text" />
        <p className="text-sm font-semibold text-custom-primary-text">{label}</p>
        <p className="text-xs text-custom-muted-text">{hint}</p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {preview}
    </div>
  );
}

// ─── Address Preview ──────────────────────────────────────────────────────────

interface AddressPreviewProps {
  addresses: string[];
  variant: 'green' | 'red';
  maxVisible?: number;
  label?: string;
}

export function AddressPreview({ addresses, variant, maxVisible = 5, label }: AddressPreviewProps) {
  if (addresses.length === 0) return null;

  const colors =
    variant === 'green'
      ? {
          border: 'border-green-500/30',
          bg: 'bg-green-50/50',
          text: 'text-green-700',
          mono: 'text-green-800',
          more: 'text-green-600',
        }
      : {
          border: 'border-red-500/30',
          bg: 'bg-red-50/50',
          text: 'text-red-700',
          mono: 'text-red-800',
          more: 'text-red-600',
        };

  return (
    <div
      className={`rounded-xl border ${colors.border} ${colors.bg} p-3 max-h-32 overflow-y-auto no-scrollbar`}
    >
      <p className={`text-xs font-bold ${colors.text} mb-1`}>
        {label ?? `${addresses.length} address(es) parsed`}
      </p>
      {addresses.slice(0, maxVisible).map((a) => (
        <p key={a} className={`text-xs font-mono ${colors.mono} truncate`}>
          {a}
        </p>
      ))}
      {addresses.length > maxVisible && (
        <p className={`text-xs ${colors.more}`}>+{addresses.length - maxVisible} more</p>
      )}
    </div>
  );
}

// ─── Pair Preview ─────────────────────────────────────────────────────────────

interface PairPreviewProps<T extends Record<string, string>> {
  rows: T[];
  variant: 'green' | 'red';
  maxVisible?: number;
  renderRow: (row: T, index: number) => React.ReactNode;
  label?: string;
}

export function PairPreview<T extends Record<string, string>>({
  rows,
  variant,
  maxVisible = 3,
  renderRow,
  label,
}: PairPreviewProps<T>) {
  if (rows.length === 0) return null;

  const colors =
    variant === 'green'
      ? {
          border: 'border-green-500/30',
          bg: 'bg-green-50/50',
          text: 'text-green-700',
          more: 'text-green-600',
        }
      : {
          border: 'border-red-500/30',
          bg: 'bg-red-50/50',
          text: 'text-red-700',
          more: 'text-red-600',
        };

  return (
    <div
      className={`rounded-xl border ${colors.border} ${colors.bg} p-3 max-h-32 overflow-y-auto no-scrollbar`}
    >
      <p className={`text-xs font-bold ${colors.text} mb-1`}>
        {label ?? `${rows.length} row(s) parsed`}
      </p>
      {rows.slice(0, maxVisible).map((row, i) => renderRow(row, i))}
      {rows.length > maxVisible && (
        <p className={`text-xs ${colors.more}`}>+{rows.length - maxVisible} more</p>
      )}
    </div>
  );
}
