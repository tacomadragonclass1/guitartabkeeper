"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  Loader2,
  ClipboardPaste,
  FileText,
  CheckCircle2,
} from "lucide-react";

interface Props {
  onSubmit: (data: {
    title: string;
    imageBase64: string | null;
    lyrics: string;
  }) => Promise<void>;
}

export default function SongForm({ onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pasteHover, setPasteHover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pasteAreaRef = useRef<HTMLDivElement>(null);

  const processImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      // Strip the data:image/png;base64, prefix
      setImageBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            processImageFile(file);
            return;
          }
        }
      }
    },
    [processImageFile]
  );

  // Also allow pasting anywhere on the page when paste area is focused
  const handleGlobalPaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            processImageFile(file);
            return;
          }
        }
      }
    },
    [processImageFile]
  );

  function focusPasteArea() {
    pasteAreaRef.current?.focus();
    document.addEventListener("paste", handleGlobalPaste, { once: true });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setPasteHover(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) processImageFile(file);
  }

  function clearImage() {
    setImageBase64(null);
    setImagePreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Song title is required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), imageBase64, lyrics });
      setSuccess(true);
      // Reset form
      setTitle("");
      setLyrics("");
      setImageBase64(null);
      setImagePreview(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col gap-5 p-6">
      <div>
        <h2
          className="mb-1 text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Add New Song
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Paste a tab image and enter your lyrics or ASCII tabs below.
        </p>
      </div>

      {/* Title */}
      <div>
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Song Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Wish You Were Here"
          className="w-full rounded-lg border px-4 py-2.5 text-base outline-none focus:ring-1"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Image Paste Area */}
      <div>
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Tab Image (Optional)
        </label>

        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Tab preview"
              className="max-h-56 w-full rounded-lg border object-contain"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
              }}
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute right-2 top-2 rounded-full p-1 transition-colors hover:bg-white/20"
              style={{ background: "rgba(0,0,0,0.6)" }}
            >
              <X size={14} style={{ color: "var(--text-primary)" }} />
            </button>
          </div>
        ) : (
          <div
            ref={pasteAreaRef}
            tabIndex={0}
            onPaste={handlePaste}
            onClick={focusPasteArea}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setPasteHover(true);
            }}
            onDragLeave={() => setPasteHover(false)}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-10 transition-colors"
            style={{
              borderColor: pasteHover ? "var(--accent)" : "var(--border)",
              background: pasteHover
                ? "rgba(201,168,76,0.06)"
                : "var(--bg-secondary)",
            }}
          >
            <div
              className="rounded-full p-3"
              style={{ background: "rgba(201,168,76,0.1)" }}
            >
              <ClipboardPaste size={22} style={{ color: "var(--accent)" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Paste or drop a tab image here
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                Click to focus, then Ctrl+V — or drag & drop
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lyrics / ASCII Tabs */}
      <div className="flex flex-1 flex-col">
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Lyrics / ASCII Tabs
        </label>
        <textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder={`e|-----------0---|\nB|-------1-------|\nG|---0-----------|\nD|---------------|\nA|---------------|\nE|---------------|\n\nVerse 1:\n...`}
          className="tab-text flex-1 resize-none rounded-lg border px-4 py-3 text-sm outline-none focus:ring-1"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
            minHeight: "180px",
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-lg px-4 py-2.5 text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            color: "#fca5a5",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ background: "var(--accent)", color: "#0f0f0f" }}
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Saving to GitHub…
          </>
        ) : success ? (
          <>
            <CheckCircle2 size={16} />
            Saved!
          </>
        ) : (
          <>
            <Upload size={16} />
            Save Song to GitHub
          </>
        )}
      </button>
    </form>
  );
}
