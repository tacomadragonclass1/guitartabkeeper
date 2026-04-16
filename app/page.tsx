"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings2, PlusCircle, Guitar, Menu, X } from "lucide-react";
import SettingsModal from "@/components/SettingsModal";
import SongBrowser from "@/components/SongBrowser";
import SongForm from "@/components/SongForm";
import SongDisplay from "@/components/SongDisplay";
import {
  Settings,
  SongSummary,
  SongData,
  listSongs,
  getSongData,
  uploadFile,
  deleteSong,
  imageUrl,
} from "@/lib/github";

const SETTINGS_KEY = "guitarsongs_settings";

const DEFAULT_SETTINGS: Settings = {
  pat: "",
  owner: "",
  repo: "",
  branch: "main",
};

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function isConfigured(s: Settings) {
  return !!(s.pat && s.owner && s.repo && s.branch);
}

/** Generate a slug-style unique ID from title + timestamp */
function makeId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const ts = Date.now().toString(36);
  return `${slug}-${ts}`;
}

export default function Home() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<"browse" | "add">("browse");

  const [songs, setSongs] = useState<SongSummary[]>([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [songsError, setSongsError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<SongData | null>(null);
  const [songLoading, setSongLoading] = useState(false);
  const [songError, setSongError] = useState<string | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    // Auto-open settings if not configured
    if (!isConfigured(s)) setShowSettings(true);
  }, []);

  const fetchSongs = useCallback(async (s: Settings) => {
    if (!isConfigured(s)) return;
    setSongsLoading(true);
    setSongsError(null);
    try {
      const list = await listSongs(s);
      setSongs(list.sort((a, b) => a.title.localeCompare(b.title)));
    } catch (err) {
      setSongsError((err as Error).message);
    } finally {
      setSongsLoading(false);
    }
  }, []);

  // Fetch songs when settings change
  useEffect(() => {
    if (isConfigured(settings)) fetchSongs(settings);
  }, [settings, fetchSongs]);

  function handleSaveSettings(s: Settings) {
    saveSettings(s);
    setSettings(s);
    setSongs([]);
    setSelectedId(null);
    setCurrentSong(null);
  }

  async function handleSelectSong(id: string) {
    setSelectedId(id);
    setView("browse");
    setSongLoading(true);
    setSongError(null);
    setCurrentSong(null);
    try {
      const data = await getSongData(id, settings);
      setCurrentSong(data);
    } catch (err) {
      setSongError((err as Error).message);
    } finally {
      setSongLoading(false);
    }
  }

  async function handleDeleteSong(id: string) {
    try {
      await deleteSong(id, settings);
      setSongs((prev) => prev.filter((s) => s.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setCurrentSong(null);
      }
    } catch (err) {
      alert(`Delete failed: ${(err as Error).message}`);
    }
  }

  async function handleAddSong({
    title,
    imageBase64,
    lyrics,
  }: {
    title: string;
    imageBase64: string | null;
    lyrics: string;
  }) {
    if (!isConfigured(settings)) {
      throw new Error("Configure GitHub settings first.");
    }

    const id = makeId(title);
    const songData: SongData = {
      id,
      title,
      lyrics,
      hasImage: !!imageBase64,
      createdAt: new Date().toISOString(),
    };

    // Upload JSON
    const jsonBase64 = btoa(
      unescape(encodeURIComponent(JSON.stringify(songData, null, 2)))
    );
    await uploadFile(
      `songs/data/${id}.json`,
      jsonBase64,
      `Add song: ${title}`,
      settings
    );

    // Upload image if present
    if (imageBase64) {
      await uploadFile(
        `songs/images/${id}.png`,
        imageBase64,
        `Add tab image for: ${title}`,
        settings
      );
    }

    // Refresh song list and select the new song
    await fetchSongs(settings);
    await handleSelectSong(id);
    setView("browse");
  }

  const configured = isConfigured(settings);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* ── Top Bar ── */}
      <header
        className="flex shrink-0 items-center gap-3 border-b px-4 py-3"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border)",
        }}
      >
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="rounded-lg p-1.5 transition-colors hover:bg-white/10 lg:hidden"
        >
          {sidebarOpen ? (
            <X size={18} style={{ color: "var(--text-muted)" }} />
          ) : (
            <Menu size={18} style={{ color: "var(--text-muted)" }} />
          )}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <Guitar size={22} style={{ color: "var(--accent)" }} />
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Guitar Songs
          </span>
        </div>

        <div className="flex-1" />

        {/* Add Song */}
        <button
          onClick={() => {
            setView("add");
            setSidebarOpen(false);
          }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: "var(--accent)", color: "#0f0f0f" }}
        >
          <PlusCircle size={14} />
          <span className="hidden sm:inline">Add Song</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="relative rounded-lg p-1.5 transition-colors hover:bg-white/10"
          title="GitHub Settings"
        >
          <Settings2 size={18} style={{ color: "var(--text-muted)" }} />
          {/* Red dot when not configured */}
          {!configured && (
            <span
              className="absolute right-1 top-1 h-2 w-2 rounded-full"
              style={{ background: "#ef4444" }}
            />
          )}
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside
          className={`flex flex-col border-r transition-all duration-200 ${
            sidebarOpen ? "w-64 lg:w-72" : "w-0"
          } overflow-hidden shrink-0`}
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border)",
          }}
        >
          {/* Sidebar: Add button at top */}
          <div
            className="border-b p-3"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              onClick={() => {
                setView("add");
                setSidebarOpen(false);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition-colors hover:bg-white/5"
              style={{
                borderColor: "var(--border)",
                color: "var(--accent)",
              }}
            >
              <PlusCircle size={14} />
              Add New Song
            </button>
          </div>

          {configured ? (
            <SongBrowser
              songs={songs}
              loading={songsLoading}
              error={songsError}
              selectedId={selectedId}
              onSelect={(id) => {
                handleSelectSong(id);
                // On mobile, close sidebar when selecting
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              onDelete={handleDeleteSong}
              onRefresh={() => fetchSongs(settings)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Configure GitHub settings to browse and save songs.
              </p>
              <button
                onClick={() => setShowSettings(true)}
                className="text-sm underline"
                style={{ color: "var(--accent)" }}
              >
                Open Settings
              </button>
            </div>
          )}
        </aside>

        {/* ── Main Content ── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {view === "add" ? (
            <div className="flex h-full flex-col overflow-y-auto">
              {/* Back to browse link */}
              <div
                className="flex shrink-0 items-center gap-2 border-b px-4 py-2"
                style={{ borderColor: "var(--border)" }}
              >
                <button
                  onClick={() => setView("browse")}
                  className="text-xs underline"
                  style={{ color: "var(--text-muted)" }}
                >
                  ← Back to browser
                </button>
              </div>
              <SongForm onSubmit={handleAddSong} />
            </div>
          ) : (
            <SongDisplay
              song={currentSong}
              imageUrl={
                selectedId && currentSong?.hasImage
                  ? imageUrl(selectedId, settings)
                  : null
              }
              loading={songLoading}
              error={songError}
            />
          )}
        </main>
      </div>

      {/* ── Settings Modal ── */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
