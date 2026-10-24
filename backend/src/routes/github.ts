import { Router } from "express";
import { z } from "zod";
import { Repository } from "../models/Repository.js";

const router = Router();

const githubHeaders: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "DevHub",
};

async function githubGet(path: string) {
  const headers = { ...githubHeaders };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`https://api.github.com${path}`, {
    headers,
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw Object.assign(
        new Error(
          "Repository or resource not found, or access is not permitted.",
        ),
        { status: 404 },
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw Object.assign(
        new Error(
          "GitHub access denied. Check token permissions and rate limits.",
        ),
        { status: response.status },
      );
    }

    throw Object.assign(
      new Error(`GitHub API request failed (${response.status}).`),
      { status: 502 },
    );
  }

  return response.json();
}

function parseGitHubUrl(input: string) {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw Object.assign(new Error("Enter a valid GitHub repository URL."), {
      status: 400,
    });
  }

  if (
    url.protocol !== "https:" ||
    url.hostname.toLowerCase() !== "github.com" ||
    url.username ||
    url.password ||
    url.port
  ) {
    throw Object.assign(
      new Error("Only https://github.com/owner/repository URLs are supported."),
      { status: 400 },
    );
  }

  const parts = url.pathname.split("/").filter(Boolean);

  if (
    parts.length !== 2 ||
    parts.some((part) => !/^[A-Za-z0-9_.-]+$/.test(part)) ||
    parts[0] === "." ||
    parts[0] === ".." ||
    parts[1] === "." ||
    parts[1] === ".."
  ) {
    throw Object.assign(
      new Error("Use a repository URL like https://github.com/owner/repo."),
      { status: 400 },
    );
  }

  return {
    owner: parts[0],
    name: parts[1].replace(/\.git$/i, ""),
  };
}

const addSchema = z.object({
  url: z.string().url(),
  projectId: z.string().max(100).optional().default(""),
});

router.get("/repositories", async (_req, res) => {
  try {
    const repositories = await Repository.find().sort({ createdAt: -1 }).lean();

    res.json(repositories);
  } catch {
    res
      .status(500)
      .json({ message: "Could not load registered repositories." });
  }
});

router.post("/repositories", async (req, res) => {
  const parsed = addSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Provide a valid repository URL." });
    return;
  }

  try {
    const { owner, name } = parseGitHubUrl(parsed.data.url);
    const repo = await githubGet(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
    );

    const saved = await Repository.findOneAndUpdate(
      { fullName: repo.full_name.toLowerCase() },
      {
        owner: repo.owner.login,
        name: repo.name,
        fullName: repo.full_name.toLowerCase(),
        url: repo.html_url,
        description: repo.description ?? "",
        isPrivate: repo.private,
        defaultBranch: repo.default_branch,
        projectId: parsed.data.projectId,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    res.status(200).json(saved);
  } catch (error) {
    const err = error as Error & { status?: number };
    res.status(err.status ?? 500).json({
      message: err.message || "Could not register repository.",
    });
  }
});

router.get("/repositories/:id/branches", async (req, res) => {
  try {
    const repo = await Repository.findById(req.params.id).lean();

    if (!repo) {
      res.status(404).json({ message: "Registered repository not found." });
      return;
    }

    const branches = await githubGet(
      `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/branches?per_page=100`,
    );

    res.json(branches.map((branch: { name: string }) => branch.name));
  } catch (error) {
    const err = error as Error & { status?: number };
    res.status(err.status ?? 500).json({ message: err.message });
  }
});

router.get("/repositories/:id/contents", async (req, res) => {
  try {
    const repo = await Repository.findById(req.params.id).lean();

    if (!repo) {
      res.status(404).json({ message: "Registered repository not found." });
      return;
    }

    const path = String(req.query.path ?? "");
    const ref = String(req.query.ref ?? repo.defaultBranch);

    if (
      path.length > 500 ||
      path.startsWith("/") ||
      path.split("/").some((part) => part === "..") ||
      ref.length > 200
    ) {
      res.status(400).json({ message: "Invalid path or branch." });
      return;
    }

    const query = new URLSearchParams({ ref });
    const safePath = path
      .split("/")
      .filter(Boolean)
      .map(encodeURIComponent)
      .join("/");

    const contents = await githubGet(
      `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/contents/${safePath}?${query}`,
    );

    res.json(contents);
  } catch (error) {
    const err = error as Error & { status?: number };
    res.status(err.status ?? 500).json({ message: err.message });
  }
});

router.get("/repositories/:id/readme", async (req, res) => {
  try {
    const repo = await Repository.findById(req.params.id).lean();

    if (!repo) {
      res.status(404).json({ message: "Registered repository not found." });
      return;
    }

    const readme = await githubGet(
      `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/readme`,
    );

    res.json({
      name: readme.name,
      download_url: readme.download_url,
      html_url: readme.html_url,
      content: readme.content,
      encoding: readme.encoding,
    });
  } catch (error) {
    const err = error as Error & { status?: number };
    res.status(err.status ?? 500).json({ message: err.message });
  }
});

router.get("/repositories/:id/commits", async (req, res) => {
  try {
    const repo = await Repository.findById(req.params.id).lean();

    if (!repo) {
      res.status(404).json({ message: "Registered repository not found." });
      return;
    }

    const commits = await githubGet(
      `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/commits?per_page=10`,
    );

    res.json(
      commits.map(
        (item: {
          sha: string;
          html_url: string;
          commit: {
            message: string;
            author?: { name?: string; date?: string };
          };
        }) => ({
          sha: item.sha,
          url: item.html_url,
          message: item.commit.message,
          author: item.commit.author?.name ?? "Unknown",
          date: item.commit.author?.date ?? null,
        }),
      ),
    );
  } catch (error) {
    const err = error as Error & { status?: number };
    res.status(err.status ?? 500).json({ message: err.message });
  }
});

export default router;
