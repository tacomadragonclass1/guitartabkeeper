export interface Settings {
  pat: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface SongSummary {
  id: string;
  title: string;
  sha: string;
}

export interface SongData {
  id: string;
  title: string;
  lyrics: string;
  hasImage: boolean;
  createdAt: string;
}

const API = "https://api.github.com";

function headers(pat: string) {
  return {
    Authorization: `Bearer ${pat}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

/** Get the SHA of an existing file (returns null if not found). */
async function getFileSha(
  path: string,
  settings: Settings
): Promise<string | null> {
  const res = await fetch(
    `${API}/repos/${settings.owner}/${settings.repo}/contents/${path}?ref=${settings.branch}`,
    { headers: headers(settings.pat) }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.sha as string;
}

/** Upload (create or update) a file on GitHub. content must be base64. */
export async function uploadFile(
  path: string,
  base64Content: string,
  message: string,
  settings: Settings
): Promise<void> {
  const sha = await getFileSha(path, settings);

  const body: Record<string, string> = {
    message,
    content: base64Content,
    branch: settings.branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `${API}/repos/${settings.owner}/${settings.repo}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(settings.pat),
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to upload ${path}: ${res.status} — ${text}`);
  }
}

/** List all songs from /songs/data on GitHub. */
export async function listSongs(settings: Settings): Promise<SongSummary[]> {
  const res = await fetch(
    `${API}/repos/${settings.owner}/${settings.repo}/contents/songs/data?ref=${settings.branch}`,
    { headers: headers(settings.pat) }
  );

  if (res.status === 404) return []; // folder doesn't exist yet
  if (!res.ok) throw new Error(`GitHub error ${res.status}: ${await res.text()}`);

  const files: Array<{ name: string; sha: string; type: string }> = await res.json();

  const songs: SongSummary[] = [];
  for (const file of files) {
    if (file.type === "file" && file.name.endsWith(".json")) {
      const id = file.name.replace(".json", "");
      // Fetch each file to get the title
      try {
        const data = await getSongData(id, settings);
        songs.push({ id, title: data.title, sha: file.sha });
      } catch {
        songs.push({ id, title: id, sha: file.sha });
      }
    }
  }

  return songs;
}

/** Fetch and decode a single song's JSON data. */
export async function getSongData(
  id: string,
  settings: Settings
): Promise<SongData> {
  const res = await fetch(
    `${API}/repos/${settings.owner}/${settings.repo}/contents/songs/data/${id}.json?ref=${settings.branch}`,
    { headers: headers(settings.pat) }
  );
  if (!res.ok) throw new Error(`Song not found: ${id}`);
  const file = await res.json();
  const decoded = atob(file.content.replace(/\n/g, ""));
  return JSON.parse(decoded) as SongData;
}

/** Delete a song (both JSON and image). */
export async function deleteSong(
  id: string,
  settings: Settings
): Promise<void> {
  const deleteFile = async (path: string) => {
    const sha = await getFileSha(path, settings);
    if (!sha) return;
    await fetch(
      `${API}/repos/${settings.owner}/${settings.repo}/contents/${path}`,
      {
        method: "DELETE",
        headers: headers(settings.pat),
        body: JSON.stringify({
          message: `Delete song ${id}`,
          sha,
          branch: settings.branch,
        }),
      }
    );
  };

  await deleteFile(`songs/data/${id}.json`);
  await deleteFile(`songs/images/${id}.png`);
}

/** Test that the PAT and repo are valid. */
export async function testConnection(settings: Settings): Promise<string> {
  const res = await fetch(
    `${API}/repos/${settings.owner}/${settings.repo}`,
    { headers: headers(settings.pat) }
  );
  if (!res.ok) throw new Error(`Cannot access repo: ${res.status}`);
  const data = await res.json();
  return data.full_name as string;
}

/** Build the raw GitHub URL for a song image. */
export function imageUrl(id: string, settings: Settings): string {
  return `https://raw.githubusercontent.com/${settings.owner}/${settings.repo}/${settings.branch}/songs/images/${id}.png`;
}
