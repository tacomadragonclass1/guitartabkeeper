"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Music,
  Loader2,
  AlertCircle,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { SongSummary } from "@/lib/github";

interface Props {
  songs: SongSummary[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export default function SongBrowser({
  songs,
  loading,
  error,
  selectedId,
  onSelect,
  onDelete,
  onRefresh,
}: Props) {
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      songs.filter((s) =>
        s.title.toLowerCase().includes(query.toLowerCase())
      ),
    [songs, query]
  );

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      // Auto-cancel confirmation after 3s
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search bar */}
      <div className="p-3">
        <div
          className="flex items-center gap-2 rounded-lg border px-3 py-2"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border)",
          }}
        >
          <Search size={14} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search songs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
      </div>

      {/* Header count + refresh */}
      <div
        className="flex items-center justify-between border-b px-3 pb-2"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {loading ? "Loading…" : `${filtered.length} song${filtered.length !== 1 ? "s" : ""}`}
        </span>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="rounded p-1 transition-colors hover:bg-white/10"
          title="Refresh"
        >
          <RefreshCw
            size={13}
            style={{ color: "var(--text-muted)" }}
            className={loading ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12">
            <Loader2
              size={18}
              className="animate-spin"
              style={{ color: "var(--accent)" }}
            />
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              Fetching songs…
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="p-4">
            <div
              className="flex items-start gap-2 rounded-lg p-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#fca5a5",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <Music size={32} style={{ color: "var(--border)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {songs.length === 0 ? "No songs yet" : "No results"}
            </p>
          </div>
        )}

        {!loading &&
          filtered.map((song) => (
            <button
              key={song.id}
              onClick={() => onSelect(song.id)}
              className="group flex w-full items-center gap-3 px-3 py-3 text-left transition-colors"
              style={{
                background:
                  selectedId === song.id
                    ? "rgba(201,168,76,0.12)"
                    : "transparent",
                borderLeft:
                  selectedId === song.id
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
              }}
            >
              <Music
                size={14}
                className="shrink-0"
                style={{
                  color:
                    selectedId === song.id ? "var(--accent)" : "var(--text-muted)",
                }}
              />
              <span
                className="flex-1 truncate text-sm font-medium"
                style={{
                  color:
                    selectedId === song.id
                      ? "var(--accent)"
                      : "var(--text-primary)",
                }}
              >
                {song.title}
              </span>
              <button
                onClick={(e) => handleDelete(song.id, e)}
                className="shrink-0 rounded p-1 opacity-0 transition-all group-hover:opacity-100"
                style={{
                  color:
                    confirmDelete === song.id ? "#ef4444" : "var(--text-muted)",
                  background:
                    confirmDelete === song.id
                      ? "rgba(239,68,68,0.15)"
                      : "transparent",
                }}
                title={
                  confirmDelete === song.id
                    ? "Click again to confirm delete"
                    : "Delete song"
                }
              >
                <Trash2 size={12} />
              </button>
            </button>
          ))}
      </div>
    </div>
  );
}
