"use client";

import { Loader2, AlertCircle, Music, ImageOff } from "lucide-react";
import { SongData } from "@/lib/github";

interface Props {
  song: SongData | null;
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
}

export default function SongDisplay({ song, imageUrl, loading, error }: Props) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-3">
        <Loader2
          size={22}
          className="animate-spin"
          style={{ color: "var(--accent)" }}
        />
        <span style={{ color: "var(--text-muted)" }}>Loading song…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div
          className="flex max-w-sm items-start gap-3 rounded-xl p-4 text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            color: "#fca5a5",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div
          className="rounded-full p-6"
          style={{ background: "rgba(201,168,76,0.06)" }}
        >
          <Music size={48} style={{ color: "var(--border)" }} />
        </div>
        <div className="text-center">
          <p
            className="text-lg font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            Select a song
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Choose from the sidebar, or add a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Song header */}
      <div
        className="border-b px-6 py-5"
        style={{ borderColor: "var(--border)" }}
      >
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {song.title}
        </h1>
        {song.createdAt && (
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Added{" "}
            {new Date(song.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      <div className="flex-1 space-y-6 p-6">
        {/* Tab Image */}
        {song.hasImage && imageUrl && (
          <div>
            <p
              className="mb-2 text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Tab Image
            </p>
            <div
              className="overflow-hidden rounded-xl border"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`Tab for ${song.title}`}
                className="max-h-[60vh] w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:48px;color:var(--text-muted);font-size:14px;"><svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='18' height='18' x='3' y='3' rx='2' ry='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/></svg>Image not yet available — it may take a moment to appear on GitHub.</div>`;
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Lyrics / ASCII Tabs */}
        {song.lyrics && (
          <div>
            <p
              className="mb-2 text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Lyrics / Tabs
            </p>
            <div
              className="rounded-xl border p-4"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
              }}
            >
              <pre
                className="tab-text text-sm leading-relaxed"
                style={{ color: "var(--text-primary)" }}
              >
                {song.lyrics}
              </pre>
            </div>
          </div>
        )}

        {!song.hasImage && !song.lyrics && (
          <div
            className="text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            This song has no content yet.
          </div>
        )}
      </div>
    </div>
  );
}
