"use client";

import { useState } from "react";
import { X, Check, Loader2, Github } from "lucide-react";
import { Settings, testConnection } from "@/lib/github";

interface Props {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
}

export default function SettingsModal({ settings, onSave, onClose }: Props) {
  const [form, setForm] = useState<Settings>({ ...settings });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  function set(key: keyof Settings, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setTestResult(null);
  }

  async function handleTest() {
    if (!form.pat || !form.owner || !form.repo) {
      setTestResult({ ok: false, msg: "Fill in all fields first." });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const name = await testConnection(form);
      setTestResult({ ok: true, msg: `Connected to ${name}` });
    } catch (e) {
      setTestResult({ ok: false, msg: (e as Error).message });
    } finally {
      setTesting(false);
    }
  }

  function handleSave() {
    onSave(form);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
    >
      <div
        className="w-full max-w-md rounded-xl border p-6 shadow-2xl"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github size={20} style={{ color: "var(--accent)" }} />
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              GitHub Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 transition-colors hover:bg-white/10"
          >
            <X size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <Field
            label="Personal Access Token"
            type="password"
            value={form.pat}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            onChange={(v) => set("pat", v)}
            hint="Needs repo read/write scope"
          />
          <Field
            label="GitHub Owner"
            value={form.owner}
            placeholder="your-username"
            onChange={(v) => set("owner", v)}
          />
          <Field
            label="Repository Name"
            value={form.repo}
            placeholder="my-guitar-songs"
            onChange={(v) => set("repo", v)}
          />
          <Field
            label="Branch"
            value={form.branch}
            placeholder="main"
            onChange={(v) => set("branch", v)}
          />
        </div>

        {/* Test result */}
        {testResult && (
          <div
            className="mt-4 rounded-lg px-3 py-2 text-sm"
            style={{
              background: testResult.ok
                ? "rgba(34,197,94,0.12)"
                : "rgba(239,68,68,0.12)",
              color: testResult.ok ? "#86efac" : "#fca5a5",
              border: `1px solid ${testResult.ok ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
            }}
          >
            {testResult.msg}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            {testing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            Test Connection
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm transition-colors hover:bg-white/5"
            style={{ color: "var(--text-muted)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "var(--accent)", color: "#0f0f0f" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label
        className="mb-1 block text-xs font-medium uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
        }}
      />
      {hint && (
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}
