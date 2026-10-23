"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Download, Maximize2, Table2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ChartDataRow {
  label: string;
  value: string | number;
}

interface ChartPanelProps {
  title: string;
  description?: string;
  data: ChartDataRow[];
  chart: ReactNode;
  className?: string;
}

function escapeCsvValue(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function ChartPanel({ title, description, data, chart, className = "" }: ChartPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTableOpen, setIsTableOpen] = useState(false);

  const exportCsv = () => {
    const csv = [["Label", "Value"], ...data.map((row) => [row.label, row.value])]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const controls = (
    <div className="flex shrink-0 items-center gap-1">
      <Button type="button" variant="ghost" size="icon" onClick={() => setIsTableOpen(true)} aria-label={`View ${title} data table`} title="View data table"><Table2 /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={exportCsv} aria-label={`Export ${title} data as CSV`} title="Export CSV"><Download /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => setIsExpanded(true)} aria-label={`Expand ${title} chart`} title="Expand chart"><Maximize2 /></Button>
    </div>
  );

  return (
    <>
      <div className={`rounded-3xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur ${className}`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div><h2 className="text-lg font-semibold">{title}</h2>{description ? <p className="text-sm text-muted-foreground">{description}</p> : null}</div>
          {controls}
        </div>
        {chart}
      </div>

      {isExpanded ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex h-[calc(100vh-1.5rem)] w-full max-w-[96vw] flex-col rounded-3xl border border-border bg-card p-5 shadow-2xl sm:h-[calc(100vh-2.5rem)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div><h2 className="text-lg font-semibold">{title}</h2>{description ? <p className="text-sm text-muted-foreground">{description}</p> : null}</div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsExpanded(false)} aria-label="Close expanded chart" title="Close"><X /></Button>
            </div>
            <div className="min-h-0 flex-1 [&>div]:h-full!">{chart}</div>
          </div>
        </div>
      ) : null}

      {isTableOpen ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-5"><h2 className="text-lg font-semibold">{title} data</h2><Button type="button" variant="ghost" size="icon" onClick={() => setIsTableOpen(false)} aria-label="Close data table" title="Close"><X /></Button></div>
            <div className="max-h-[60vh] overflow-auto p-5"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Label</th><th className="px-3 py-2 text-right font-medium">Value</th></tr></thead><tbody>{data.map((row) => <tr key={row.label} className="border-b border-border/60 last:border-0"><td className="px-3 py-2">{row.label}</td><td className="px-3 py-2 text-right font-medium">{row.value}</td></tr>)}</tbody></table></div>
            <div className="flex justify-end border-t border-border p-4"><Button type="button" onClick={exportCsv}><Download /> Export CSV</Button></div>
          </div>
        </div>
      ) : null}
    </>
  );
}