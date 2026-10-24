import { useState, type ReactNode } from "react";
import { PROJECTS, NAV } from "../data";
import GitHubRepositories from "./components/GitHubRepositories";
const IC: Record<string, string> = {
  folder:
    "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  file: "M6 2h9l5 5v15H6zM14 2v6h6",
  code: "m8 8-5 4 5 4M16 8l5 4-5 4",
  db: "M4 6c0-2 16-2 16 0v12c0 2-16 2-16 0zM4 12c0 2 16 2 16 0",
  svc: "M12 2 3 7l9 5 9-5zM3 12l9 5 9-5",
  api: "M4 12h16M12 4l8 8-8 8",
  book: "M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6",
  check: "m5 12 5 5L20 7",
  home: "M3 11 12 3l9 8v10H3z",
  arch: "M3 3h7v7H3zM14 14h7v7h-7zM10 7h4v7",
  chev: "m9 6 6 6-6 6",
  x: "M18 6 6 18M6 6l12 12",
};

const Ic = ({ n, s = 16 }: { n: string; s?: number }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={IC[n] || IC.file} />
  </svg>
);

const NI: Record<string, string> = {
  Home: "home",
  Projects: "folder",
  Services: "svc",
  Teams: "db",
  "API Directory": "api",
  Documentation: "book",
  Onboarding: "check",
  "Engineering Insights": "arch",
  Settings: "code",
  "GitHub Repositories": "code",
};

function hl(s: string) {
  const e = s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return e.replace(
    /(\/\/.*$|#.*$)|("[^"\n]*"|'[^'\n]*'|`[^`]*`)|\b(import|from|export|const|let|return|async|await|function|if|else|new|FROM|COPY|RUN|CMD)\b/gm,
    (m, c, st) =>
      c
        ? `<i class="c">${m}</i>`
        : st
          ? `<i class="s">${m}</i>`
          : `<i class="k">${m}</i>`,
  );
}

function Code({ src }: { src: string }) {
  const [ok, setOk] = useState(false);

  return (
    <div className="code">
      <button
        onClick={() => {
          navigator.clipboard?.writeText(src).catch(() => {});
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        }}
      >
        {ok ? "Copied" : "Copy"}
      </button>
      <pre dangerouslySetInnerHTML={{ __html: hl(src) }} />
    </div>
  );
}

function Md({ src }: { src: string }) {
  const out: ReactNode[] = [];
  const L = src.split("\n");
  let i = 0;

  const inl = (t: string) => (
    <span
      dangerouslySetInnerHTML={{
        __html: t
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
          .replace(/`(.+?)`/g, "<code>$1</code>"),
      }}
    />
  );

  while (i < L.length) {
    const l = L[i];

    if (l.startsWith("```")) {
      const b: string[] = [];
      i++;
      while (i < L.length && !L[i].startsWith("```")) {
        b.push(L[i++]);
      }
      out.push(<Code key={i} src={b.join("\n")} />);
    } else if (l.startsWith("# ")) {
      out.push(<h1 key={i}>{l.slice(2)}</h1>);
    } else if (l.startsWith("## ")) {
      out.push(
        <h2 key={i} id={l.slice(3)}>
          {l.slice(3)}
        </h2>,
      );
    } else if (l.startsWith("- ")) {
      const b: string[] = [];
      while (i < L.length && L[i].startsWith("- ")) {
        b.push(L[i++].slice(2));
      }
      i--;
      out.push(
        <ul key={i}>
          {b.map((x, j) => (
            <li key={j}>{inl(x)}</li>
          ))}
        </ul>,
      );
    } else if (l.trim()) {
      out.push(<p key={i}>{inl(l)}</p>);
    }

    i++;
  }

  return <div className="md">{out}</div>;
}

const Badge = ({ s }: { s: string }) => (
  <span
    className={
      "bd " +
      (({ "On track": "ok", "At risk": "wa" } as Record<string, string>)[s] ||
        "")
    }
  >
    {s}
  </span>
);

function Tree({ p, open, sel, pick, tog }: any) {
  const T = [
    { id: "overview", l: "Overview", ic: "file" },
    { id: "arch", l: "Architecture", ic: "arch" },
    {
      id: "g:repos",
      l: "Repositories",
      ic: "folder",
      k: p.repos.map((r: any) => ({ id: "repo:" + r.n, l: r.n, ic: "code" })),
    },
    {
      id: "g:svcs",
      l: "Services",
      ic: "folder",
      k: p.svcs.map((s: string) => ({ id: "svc:" + s, l: s, ic: "svc" })),
    },
    {
      id: "g:apis",
      l: "APIs",
      ic: "folder",
      k: p.apis.map((a: any) => ({ id: "api:" + a.n, l: a.n, ic: "api" })),
    },
    {
      id: "g:env",
      l: "Environment Setup",
      ic: "folder",
      k: p.env.map((e: any) => ({ id: "env:" + e[0], l: e[0], ic: "file" })),
    },
    {
      id: "g:docs",
      l: "Documentation",
      ic: "folder",
      k: p.docs.map((d: any) => ({ id: "doc:" + d[0], l: d[0], ic: "book" })),
    },
    { id: "onb", l: "Onboarding Tasks", ic: "check" },
  ];

  const row = (n: any, d: number): ReactNode => {
    const g = n.id.startsWith("g:");

    return (
      <div key={n.id}>
        <button
          className={"tr" + (sel === n.id ? " on" : "")}
          style={{ paddingLeft: 10 + d * 14 }}
          onClick={() => (g ? tog(n.id) : pick(n.id, n.l))}
          aria-expanded={g ? !!open[n.id] : undefined}
        >
          {g ? (
            <span className={"ch" + (open[n.id] ? " o" : "")}>
              <Ic n="chev" s={12} />
            </span>
          ) : (
            <span style={{ width: 12 }} />
          )}
          <Ic n={n.ic} />
          {n.l}
        </button>
        {g && open[n.id] && n.k?.map((c: any) => row(c, d + 1))}
      </div>
    );
  };

  return <>{T.map((n) => row(n, 0))}</>;
}

function Repo({ p, name, path, setPath }: any) {
  const r = p.repos.find((x: any) => x.n === name);
  const [br, setBr] = useState("main");

  if (!r) return <div className="empty">Repository not found.</div>;

  let cur: any = r.fs;
  path.forEach((k: string) => {
    cur = cur?.[k];
  });

  if (cur === undefined || cur === null) {
    return (
      <div className="empty">This repository item could not be found.</div>
    );
  }

  const crumb = (
    <div className="crumb">
      <button onClick={() => setPath([])}>{name}</button>
      {path.map((k: string, i: number) => (
        <span key={i}>
          {" "}
          / <button onClick={() => setPath(path.slice(0, i + 1))}>{k}</button>
        </span>
      ))}
    </div>
  );

  if (typeof cur === "string") {
    return (
      <div>
        {crumb}
        <div className="card">
          <div className="row sp">
            <b>{path[path.length - 1]}</b>
            <button
              className="btn s"
              onClick={() => setPath(path.slice(0, -1))}
            >
              Back to folder
            </button>
          </div>
          <Code src={cur} />
        </div>
      </div>
    );
  }

  const ents = Object.entries(cur).sort(
    (a: any, b: any) =>
      (typeof a[1] === "string" ? 1 : 0) - (typeof b[1] === "string" ? 1 : 0),
  );

  return (
    <div>
      <h1>{name}</h1>
      <p className="mu">{r.d}. Mock repository content for this demo.</p>
      <div className="row" style={{ margin: "12px 0" }}>
        {crumb}
        <select
          aria-label="Branch"
          value={br}
          onChange={(e) => setBr(e.target.value)}
        >
          <option>main</option>
          <option>develop</option>
          <option>release/1.4</option>
        </select>
      </div>
      <div className="card nop">
        {ents.map(([k, v]: any) => (
          <button key={k} className="fr" onClick={() => setPath([...path, k])}>
            <Ic
              n={
                typeof v === "string"
                  ? k.endsWith(".ts")
                    ? "code"
                    : "file"
                  : "folder"
              }
            />
            <span>{k}</span>
            <span className="mu">{typeof v === "string" ? "" : "folder"}</span>
          </button>
        ))}
      </div>
      {cur["README.md"] && (
        <div className="card" style={{ marginTop: 16 }}>
          <b>README.md</b>
          <Md src={cur["README.md"]} />
        </div>
      )}
      {!path.length && (
        <div className="card" style={{ marginTop: 16 }}>
          <b>Recent commits on {br}</b>
          {p.commits.map((c: string[], i: number) => (
            <div className="row sp cm" key={i}>
              <span>{c[0]}</span>
              <span className="mu">
                {c[1]} · {c[2]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Api({ p, name }: any) {
  const a = p.apis.find((x: any) => x.n === name);
  const [i, setI] = useState(0);

  if (!a || !a.eps?.length)
    return <div className="empty">API details unavailable.</div>;

  const e = a.eps[i];

  return (
    <div>
      <h1>{name}</h1>
      <div className="split">
        <div className="card nop">
          {a.eps.map((x: any, j: number) => (
            <button
              key={j}
              className={"fr" + (i === j ? " on" : "")}
              onClick={() => setI(j)}
            >
              <span className={"m " + x[0]}>{x[0]}</span>
              <code>{x[1]}</code>
            </button>
          ))}
        </div>
        <div className="card">
          <h2>
            <span className={"m " + e[0]}>{e[0]}</span> <code>{e[1]}</code>
          </h2>
          <p>{e[2]}</p>
          <p className="mu">
            Authentication: <b>{e[3]}</b>
          </p>
          <h3>Parameters</h3>
          {e[4]?.length ? (
            <table>
              <tbody>
                {e[4].map((q: string[]) => (
                  <tr key={q[0]}>
                    <td>
                      <code>{q[0]}</code>
                    </td>
                    <td>{q[1]}</td>
                    <td className="mu">{q[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mu">None</p>
          )}
          {e[5] && (
            <>
              <h3>Request body</h3>
              <Code src={JSON.stringify(e[5], null, 2)} />
            </>
          )}
          <h3>Response · 200</h3>
          <Code src={JSON.stringify(e[6], null, 2)} />
        </div>
      </div>
    </div>
  );
}

function Arch({ p }: any) {
  const b = (x: number, y: number, t: string, s: string, c = "var(--card)") => (
    <g>
      <rect
        x={x}
        y={y}
        width="150"
        height="52"
        rx="8"
        fill={c}
        stroke="var(--bd)"
      />
      <text
        x={x + 75}
        y={y + 23}
        textAnchor="middle"
        fontWeight="600"
        fontSize="13"
        fill="var(--tx)"
      >
        {t}
      </text>
      <text
        x={x + 75}
        y={y + 40}
        textAnchor="middle"
        fontSize="11"
        fill="var(--mu)"
      >
        {s}
      </text>
    </g>
  );

  const ln = (a: number, b2: number, c: number, d: number) => (
    <line
      x1={a}
      y1={b2}
      x2={c}
      y2={d}
      stroke="var(--ac)"
      strokeWidth="1.5"
      markerEnd="url(#ar)"
    />
  );

  return (
    <div>
      <h1>Architecture</h1>
      <p className="mu">How {p.name} connects clients, services and data.</p>
      <div className="card" style={{ overflowX: "auto" }}>
        <svg
          viewBox="0 0 760 330"
          width="760"
          role="img"
          aria-label="Architecture diagram"
        >
          <defs>
            <marker
              id="ar"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0 0 8 4 0 8z" fill="var(--ac)" />
            </marker>
          </defs>
          {ln(160, 165, 230, 165)}
          {ln(380, 150, 450, 70)}
          {ln(380, 165, 450, 165)}
          {ln(380, 180, 450, 260)}
          {ln(600, 70, 600, 140)}
          {b(10, 140, "Web client", p.tech[0])}
          {b(230, 140, "API gateway", "Core API", "var(--acs)")}
          {b(450, 45, p.svcs[1] || "Service", "Service")}
          {b(450, 140, p.svcs[2] || "Service", "Service")}
          {b(450, 235, "Event bus", "Kafka")}
          {b(600, 235, "Database", "PostgreSQL")}
          {ln(525, 235, 525, 192)}
        </svg>
      </div>
    </div>
  );
}

export default function App() {
  const [nav, setNav] = useState("Home");
  const [pid, setPid] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [view, setView] = useState("card");
  const [tabs, setTabs] = useState<any[]>([]);
  const [act, setAct] = useState("overview");
  const [open, setOpen] = useState<any>({ "g:repos": true });
  const [paths, setPaths] = useState<any>({});
  const [done, setDone] = useState<any>({});
  const [recent, setRecent] = useState<string[]>(["ecom"]);

  const p = PROJECTS.find((x: any) => x.id === pid);

  const openProj = (id: string) => {
    setPid(id);
    setTabs([{ id: "overview", l: "Overview" }]);
    setAct("overview");
    setRecent((old) => [id, ...old.filter((r) => r !== id)].slice(0, 3));
  };

  const pick = (id: string, l: string) => {
    setTabs((t) => (t.some((x) => x.id === id) ? t : [...t, { id, l }]));
    setAct(id);
  };

  const close = (id: string) => {
    const r = tabs.filter((t) => t.id !== id);
    setTabs(r);
    if (act === id) setAct(r.length ? r[r.length - 1].id : "");
  };

  const list = PROJECTS.filter((x: any) =>
    (x.name + x.tech.join() + x.team).toLowerCase().includes(q.toLowerCase()),
  );

  const card = (x: any) =>
    view === "card" ? (
      <div className="card hl" key={x.id}>
        <div className="row sp">
          <h3>{x.name}</h3>
          <Badge s={x.st} />
        </div>
        <p className="mu">{x.d}</p>
        <div>
          {x.tech.map((t: string) => (
            <span className="bd" key={t}>
              {t}
            </span>
          ))}
        </div>
        <p className="mu">
          {x.team} · {x.repos.length} repos · {x.svcs.length} services · {x.upd}
        </p>
        <button className="btn" onClick={() => openProj(x.id)}>
          Open Project
        </button>
      </div>
    ) : (
      <tr key={x.id}>
        <td>
          <b>{x.name}</b>
        </td>
        <td>
          <Badge s={x.st} />
        </td>
        <td>{x.team}</td>
        <td>{x.repos.length} repos</td>
        <td>{x.svcs.length} svcs</td>
        <td className="mu">{x.upd}</td>
        <td>
          <button className="btn" onClick={() => openProj(x.id)}>
            Open Project
          </button>
        </td>
      </tr>
    );

  const content = () => {
    if (!p) return null;
    const a = act;

    if (a === "overview") {
      return (
        <div>
          <h1>{p.name}</h1>
          <p>{p.d}</p>
          <p>
            <Badge s={p.st} />
            {p.tech.map((t: string) => (
              <span className="bd" key={t}>
                {t}
              </span>
            ))}
          </p>
          <p className="mu">
            Owned by {p.team}. {p.repos.length} repositories, {p.svcs.length}{" "}
            services, {p.apis.length} APIs.
          </p>
        </div>
      );
    }

    if (a === "arch") return <Arch p={p} />;

    if (a.startsWith("repo:")) {
      const n = a.slice(5);
      const k = p.id + n;
      return (
        <Repo
          p={p}
          name={n}
          path={paths[k] || []}
          setPath={(v: string[]) => setPaths({ ...paths, [k]: v })}
        />
      );
    }

    if (a.startsWith("svc:")) {
      return (
        <div>
          <h1>{a.slice(4)}</h1>
          <p className="mu">Mock service record used by {p.name}.</p>
          <div className="card">
            <p>
              <span className="bd ok">Healthy</span>
              <span className="bd">Production</span>
            </p>
            <p>Owner: {p.team}</p>
            <p>Latest deploy: v2.14.3, 4h ago</p>
          </div>
        </div>
      );
    }

    if (a.startsWith("api:")) return <Api key={a} p={p} name={a.slice(4)} />;

    if (a.startsWith("env:")) {
      const e = p.env.find((x: any) => x[0] === a.slice(4));
      return e ? (
        <div>
          <h1>{e[0]}</h1>
          <Md src={e[1]} />
        </div>
      ) : (
        <div className="empty">Setup guide not found.</div>
      );
    }

    if (a.startsWith("doc:")) {
      const d = p.docs.find((x: any) => x[0] === a.slice(4));
      if (!d) return <div className="empty">Documentation not found.</div>;

      const toc = d[1]
        .split("\n")
        .filter((l: string) => l.startsWith("## "))
        .map((l: string) => l.slice(3));

      return (
        <div className="split r">
          <div className="card">
            <Md src={d[1]} />
          </div>
          <div className="card">
            <b>On this page</b>
            {toc.map((t: string) => (
              <a className="toc" key={t} href={"#" + t}>
                {t}
              </a>
            ))}
          </div>
        </div>
      );
    }

    if (a === "onb") {
      const n = p.tasks.filter((_: any, i: number) => done[p.id + i]).length;

      return (
        <div>
          <h1>Onboarding Tasks</h1>
          <p className="mu">
            {n} of {p.tasks.length} complete
          </p>
          <div className="bar">
            <b
              style={{
                width: (p.tasks.length ? (n / p.tasks.length) * 100 : 0) + "%",
              }}
            />
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            {p.tasks.map((t: string, i: number) => (
              <label className="ck" key={t}>
                <input
                  type="checkbox"
                  checked={!!done[p.id + i]}
                  onChange={() =>
                    setDone({ ...done, [p.id + i]: !done[p.id + i] })
                  }
                />
                {t}
              </label>
            ))}
          </div>
        </div>
      );
    }

    return <div className="empty">Select an item from the explorer.</div>;
  };

  return (
    <div className="app">
      <nav aria-label="Main">
        <div className="logo">DevHub</div>
        {NAV.map((n: string) => (
          <button
            key={n}
            className={"nv" + (nav === n && !p ? " on" : "")}
            onClick={() => {
              setNav(n);
              setPid(null);
            }}
          >
            <Ic n={NI[n] || "file"} />
            {n}
          </button>
        ))}
        <div className="me">Alex Morgan</div>
      </nav>

      {p && (
        <aside className="ex" aria-label="Project explorer">
          <div className="exh">
            <button className="btn s" onClick={() => setPid(null)}>
              All projects
            </button>
            <select
              aria-label="Switch project"
              value={p.id}
              onChange={(e) => openProj(e.target.value)}
            >
              {PROJECTS.map((x: any) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
          <Tree
            p={p}
            open={open}
            sel={act}
            pick={pick}
            tog={(id: string) => setOpen({ ...open, [id]: !open[id] })}
          />
        </aside>
      )}

      <main>
        {p ? (
          <>
            <div className="tabs" role="tablist">
              {tabs.map((t) => (
                <div key={t.id} className={"tab" + (act === t.id ? " on" : "")}>
                  <button
                    role="tab"
                    aria-selected={act === t.id}
                    onClick={() => setAct(t.id)}
                  >
                    {t.l}
                  </button>
                  <button
                    aria-label={"Close " + t.l}
                    onClick={() => close(t.id)}
                  >
                    <Ic n="x" s={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="pg">{content()}</div>
          </>
        ) : (
          <div className="pg">
            {nav === "GitHub Repositories" ? (
              <GitHubRepositories />
            ) : nav === "Home" ? (
              <>
                <h1>Welcome to DevHub 👋</h1>
                <p className="mu">
                  Your developer workspace for discovering projects,
                  repositories, services, APIs, and documentation.
                </p>
                <div className="g" style={{ marginTop: 20 }}>
                  <div className="card">
                    <h3>{PROJECTS.length}</h3>
                    <p className="mu">Projects</p>
                    <button className="btn" onClick={() => setNav("Projects")}>
                      Browse projects
                    </button>
                  </div>
                  <div className="card">
                    <h3>
                      {PROJECTS.reduce(
                        (total: number, project: any) =>
                          total + project.repos.length,
                        0,
                      )}
                    </h3>
                    <p className="mu">Repositories</p>
                  </div>
                  <div className="card">
                    <h3>
                      {PROJECTS.reduce(
                        (total: number, project: any) =>
                          total + project.svcs.length,
                        0,
                      )}
                    </h3>
                    <p className="mu">Services</p>
                  </div>
                  <div className="card">
                    <h3>
                      {PROJECTS.reduce(
                        (total: number, project: any) =>
                          total + project.apis.length,
                        0,
                      )}
                    </h3>
                    <p className="mu">API groups</p>
                  </div>
                </div>
                <h2 style={{ marginTop: 24 }}>Recently opened</h2>
                <div className="g">
                  {recent.map((id) => {
                    const project = PROJECTS.find((x: any) => x.id === id);
                    if (!project) return null;
                    return (
                      <div className="card" key={id}>
                        <h3>{project.name}</h3>
                        <p className="mu">{project.d}</p>
                        <button
                          className="btn"
                          onClick={() => openProj(project.id)}
                        >
                          Open project
                        </button>
                      </div>
                    );
                  })}
                </div>
                <h2 style={{ marginTop: 24 }}>Quick access</h2>
                <div className="g">
                  {[
                    "Projects",
                    "Services",
                    "API Directory",
                    "Documentation",
                    "Onboarding",
                  ].map((item) => (
                    <button
                      className="chip"
                      key={item}
                      onClick={() => setNav(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </>
            ) : nav === "Projects" ? (
              <>
                <h1>Projects</h1>
                <p className="mu">
                  Open a project to explore its repositories, services, and
                  docs.
                </p>
                <div className="row" style={{ margin: "12px 0" }}>
                  <input
                    aria-label="Search projects"
                    placeholder="Search projects"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <button
                    className={"btn s" + (view === "card" ? " on" : "")}
                    onClick={() => setView("card")}
                  >
                    Cards
                  </button>
                  <button
                    className={"btn s" + (view === "list" ? " on" : "")}
                    onClick={() => setView("list")}
                  >
                    List
                  </button>
                </div>
                {!q && (
                  <>
                    <h2>Pinned</h2>
                    <div className="g">
                      {PROJECTS.filter((x: any) => x.pin).map((x: any) => (
                        <button
                          className="chip"
                          key={x.id}
                          onClick={() => openProj(x.id)}
                        >
                          {x.name}
                        </button>
                      ))}
                    </div>
                    <h2 style={{ marginTop: 16 }}>Recently opened</h2>
                    <div className="g">
                      {recent.map((id) => {
                        const x = PROJECTS.find((y: any) => y.id === id);
                        return x ? (
                          <button
                            className="chip"
                            key={id}
                            onClick={() => openProj(id)}
                          >
                            {x.name}
                          </button>
                        ) : null;
                      })}
                    </div>
                    <h2 style={{ margin: "16px 0 8px" }}>All projects</h2>
                  </>
                )}
                {!list.length ? (
                  <div className="empty">No projects match “{q}”.</div>
                ) : view === "card" ? (
                  <div className="g">{list.map(card)}</div>
                ) : (
                  <div className="card">
                    <table>
                      <tbody>{list.map(card)}</tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="empty">
                <h2>{nav}</h2>
                <p>
                  This section is not fully implemented yet. Open a project to
                  explore its available details.
                </p>
                <button className="btn" onClick={() => setNav("Projects")}>
                  Go to Projects
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
