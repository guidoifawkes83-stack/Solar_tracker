"use client";

import { useState } from "react";
import ProjectForm, { type ProjectPrefill } from "@/components/ProjectForm";

interface Props {
  action: (formData: FormData) => void;
  liveFxRate: number;
}

export default function NewProjectClient({ action, liveFxRate }: Props) {
  const [prefill, setPrefill] = useState<ProjectPrefill | undefined>(undefined);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  async function handleFile(file: File) {
    setParsing(true);
    setError(null);
    setNote(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/projects/parse-invoice", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Couldn't read that PDF.");
      }
      setPrefill(data.prefill as ProjectPrefill);
      setNote(data.note as string);
      setFormKey((k) => k + 1); // remount ProjectForm so its defaultValues pick up the prefill
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that PDF.");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border border-dashed border-neutral-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-neutral-300 mb-1">
          Start from a supplier PDF (optional)
        </h2>
        <p className="text-xs text-neutral-500 mb-3">
          Drop the supplier's proforma invoice or quotation and I&apos;ll pre-fill what it
          actually contains — the supplier total, invoice/model number, client name (if
          the PDF names one), and system size. Your quote to the client, labor cost,
          extras budget, and TT fee aren&apos;t on a supplier invoice, so those still need
          your input. Review every pre-filled number before saving — nothing here is final
          until you submit the form below.
        </p>
        <input
          type="file"
          accept="application/pdf"
          disabled={parsing}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = ""; // allow re-uploading the same file name later
          }}
          className="text-sm text-neutral-300 file:mr-3 file:rounded-md file:border file:border-neutral-700 file:bg-neutral-800 file:px-3 file:py-1.5 file:text-sm file:text-neutral-200 file:hover:bg-neutral-700 disabled:opacity-50"
        />
        {parsing && <p className="text-xs text-neutral-500 mt-2">Reading PDF…</p>}
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        {note && !error && <p className="text-xs text-emerald-400 mt-2">{note}</p>}
      </div>

      <ProjectForm
        key={formKey}
        action={action}
        liveFxRate={liveFxRate}
        submitLabel="Create project"
        clientName={prefill?.client_name}
        prefill={prefill}
      />
    </div>
  );
}
