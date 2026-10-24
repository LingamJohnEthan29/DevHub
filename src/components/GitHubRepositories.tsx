import { useEffect, useState } from "react";

const API = `${import.meta.env.VITE_API_URL ?? "http://localhost:4000"}/api/github`;

type Repo = {
  _id: string;
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description: string;
  isPrivate: boolean;
  defaultBranch: string;
};

type Entry = {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  html_url?: string;
};

type Commit = {
  sha: string;
  url: string;
  message: string;
  author: string;
  date: string | null;
};

export default function GitHubRepositories() {
  const [url, setUrl] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selected, setSelected] = useState<Repo | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [branch, setBranch] = useState("");
  const [path, setPath] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [fileText, setFileText] = useState("");
  const [commits, setCommits] = useState<Commit[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API}${endpoint}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data as T;
  }

  async function loadRepos() {
    setError("");
    try {
      setRepos(await request<Repo[]>("/repositories"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load repositories");
    }
  }

  useEffect(() => {
    void loadRepos();
  }, []);

  async function addRepo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch(`${API}/repositories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not add repository");
      }

      setUrl("");
      await loadRepos();
      await openRepo(data as Repo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add repository");
    } finally {
      setBusy(false);
    }
  }

  async function openRepo(repo: Repo) {
    setSelected(repo);
    setBranch(repo.defaultBranch);
    setPath("");
    setEntries([]);
    setFileText("");
    setCommits([]);
    setError("");
    setBusy(true);

    try {
      const [branchData, commitData] = await Promise.all([
        request<string[]>(`/repositories/${repo._id}/branches`),
        request<Commit[]>(`/repositories/${repo._id}/commits`),
      ]);

      setBranches(branchData);
      setCommits(commitData);
      await loadPath(repo, "", repo.defaultBranch);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load repository");
    } finally {
      setBusy(false);
    }
  }

  async function loadPath(repo: Repo, nextPath: string, nextBranch: string) {
    setBusy(true);
    setError("");
    setPath(nextPath);
    setFileText("");

    try {
      const query = new URLSearchParams({
        path: nextPath,
        ref: nextBranch,
      });
      const data = await request<Entry | Entry[]>(
        `/repositories/${repo._id}/contents?${query}`,
      );

      if (Array.isArray(data)) {
        setEntries(data);
      } else if (data.type === "file") {
        setEntries([]);
        const file = await request<{
          content?: string;
          encoding?: string;
          download_url?: string;
        }>(
          `/repositories/${repo._id}/contents?${new URLSearchParams({
            path: data.path,
            ref: nextBranch,
          })}`,
        );

        if (file.encoding === "base64" && file.content) {
          const binary = atob(file.content.replace(/\s/g, ""));
          const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
          setFileText(new TextDecoder().decode(bytes));
        } else if (file.download_url) {
          setFileText("This file needs to be loaded using its download URL.");
        } else {
          setFileText("No text content available for this file.");
        }
      } else {
        setEntries([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this path");
    } finally {
      setBusy(false);
    }
  }

  function changeBranch(nextBranch: string) {
    if (!selected) return;
    setBranch(nextBranch);
    void loadPath(selected, "", nextBranch);
  }

  return (
    <section className="github-repositories">
      <h1>GitHub Repositories</h1>
      <p>Connect public or authorized private repositories to DevHub.</p>

      <form onSubmit={addRepo} className="github-add-form">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repository"
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? "Please wait..." : "Add repository"}
        </button>
      </form>

      {error && (
        <p role="alert" className="github-error">
          {error}
        </p>
      )}

      <div className="github-layout">
        <aside>
          <h2>Connected repositories</h2>
          {repos.length === 0 && <p>No repositories connected yet.</p>}
          {repos.map((repo) => (
            <button
              key={repo._id}
              type="button"
              className="github-repo-button"
              onClick={() => void openRepo(repo)}
            >
              {repo.fullName}
              {repo.isPrivate ? " · Private" : " · Public"}
            </button>
          ))}
        </aside>

        <main>
          {selected ? (
            <>
              <h2>{selected.fullName}</h2>
              <p>{selected.description || "No description provided."}</p>
              <p>
                <a href={selected.url} target="_blank" rel="noreferrer">
                  Open on GitHub
                </a>
              </p>

              <label>
                Branch{" "}
                <select
                  value={branch}
                  onChange={(e) => changeBranch(e.target.value)}
                >
                  {branches.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <p>
                <button
                  type="button"
                  disabled={!path || busy}
                  onClick={() => {
                    const parent = path.split("/").slice(0, -1).join("/");
                    void loadPath(selected, parent, branch);
                  }}
                >
                  Up one folder
                </button>
                <strong> {path || "/"}</strong>
              </p>

              {busy && <p>Loading GitHub data...</p>}

              <ul>
                {entries.map((entry) => (
                  <li key={entry.path}>
                    <button
                      type="button"
                      onClick={() => {
                        const nextPath = path
                          ? `${path}/${entry.name}`
                          : entry.name;
                        void loadPath(selected, nextPath, branch);
                      }}
                    >
                      {entry.type === "dir" ? "📁 " : "📄 "}
                      {entry.name}
                    </button>
                  </li>
                ))}
              </ul>

              {fileText && (
                <pre className="github-file-content">
                  <code>{fileText}</code>
                </pre>
              )}

              <h3>Recent commits</h3>
              <ul>
                {commits.map((commit) => (
                  <li key={commit.sha}>
                    <a href={commit.url} target="_blank" rel="noreferrer">
                      {commit.message.split("\n")[0]}
                    </a>
                    {" — "}
                    {commit.author}
                    {commit.date
                      ? ` · ${new Date(commit.date).toLocaleDateString()}`
                      : ""}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>Add or select a repository to explore its contents.</p>
          )}
        </main>
      </div>
    </section>
  );
}
