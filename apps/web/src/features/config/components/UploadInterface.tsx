'use client';

import { useRef, useState } from 'react';
import { Upload, Eye } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// ─── CSV Upload Panel ─────────────────────────────────────────────────────────

interface CsvUploadPanelProps {
  label: string;
  hint: string;
  onParsed: (data: Record<string, string>[]) => void;
  preview: React.ReactNode;
  expectedHeaders?: string[];
}

export function CsvUploadPanel({
  label,
  hint,
  onParsed,
  preview,
  expectedHeaders,
}: CsvUploadPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        if (expectedHeaders) {
          const missing = expectedHeaders.filter((h) => !headers.includes(h));
          if (missing.length > 0) {
            toast.error(`Invalid CSV structure. Missing headers: ${missing.join(', ')}`);
            // Clear input
            if (fileRef.current) fileRef.current.value = '';
            onParsed([]);
            return;
          }
        }
        onParsed(results.data);
      },
      error: (error) => {
        toast.error(`CSV Parsing Error: ${error.message}`);
        onParsed([]);
      },
    });
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

// ─── CSV Preview Table (renders row count + modal preview) ──────────────────────

interface CsvPreviewTableProps {
  data: Record<string, string>[];
  variant: 'green' | 'red';
  label?: string; // keeping label optional for backwards compatibility
}

export function CsvPreviewTable({ data, variant }: CsvPreviewTableProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (data.length === 0) return null;

  // Dynamically adapt columns to whatever headers are present in the parsed CSV file
  const headers = Object.keys(data[0] || {});

  const colors =
    variant === 'green'
      ? {
          badge:
            'border-green-500/30 bg-green-50/50 hover:bg-green-100/50 text-green-700 dark:bg-green-950/10 dark:text-green-400 dark:hover:bg-green-950/20',
          text: 'text-green-700 dark:text-green-400',
        }
      : {
          badge:
            'border-red-500/30 bg-red-50/50 hover:bg-red-100/50 text-red-700 dark:bg-red-950/10 dark:text-red-400 dark:hover:bg-red-950/20',
          text: 'text-red-700 dark:text-red-400',
        };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`flex items-center justify-between w-full px-4 py-3 border rounded-xl font-medium text-sm transition-all cursor-pointer ${colors.badge}`}
        >
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
            {data.length} rows loaded
          </span>
          <span className="flex items-center gap-1.5 text-xs underline font-semibold">
            <Eye className="w-3.5 h-3.5" />
            View Data
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl border-2 border-custom-primary-color bg-custom-bg custom-box-shadow rounded-2xl md:p-6 p-4">
        <DialogHeader className="pb-2 border-b border-custom-primary-color/20">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-custom-primary-text">
            <span>CSV Data Preview</span>
            <span className={`text-xs border rounded-full py-0.5 px-2 font-mono ${colors.badge}`}>
              {data.length} Rows
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Dynamic, clean table layout inspired by the uploaded image */}
        <div className="mt-4 rounded-xl border border-custom-primary-color/20 overflow-hidden bg-white dark:bg-neutral-900 max-h-[60vh] overflow-y-auto no-scrollbar">
          <Table className="border-collapse">
            <TableHeader className="bg-neutral-50 dark:bg-neutral-800/30">
              <TableRow className="hover:bg-transparent border-b border-custom-primary-color/10">
                {headers.map((header) => (
                  <TableHead
                    key={header}
                    className="font-bold text-xs uppercase tracking-wider text-custom-muted-text py-4 px-4 h-auto"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow
                  key={idx}
                  className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 border-b border-custom-primary-color/5 last:border-b-0"
                >
                  {headers.map((header) => (
                    <TableCell
                      key={header}
                      className="font-mono text-sm py-3.5 px-4 text-custom-primary-text max-w-[250px] truncate"
                    >
                      {row[header]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
