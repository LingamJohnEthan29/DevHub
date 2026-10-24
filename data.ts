/* All data is mock. Files are strings; folders are objects. */

const rd = (name: string, description: string) =>
  `# ${name}

${description}

## Getting started

- Install dependencies
- Copy .env.example to .env
- Run the dev server`;

const src = (name: string) => `import { Router } from 'express';

// ${name} routes
export const router = Router();

router.get('/', async (req, res) => {
  const items = await db.list({ limit: 20 });
  res.json({ items, total: items.length });
});

router.post('/', async (req, res) => {
  const created = await db.create(req.body);
  res.status(201).json(created);
});`;

const mk = (name: string, description: string) => ({
  "README.md": rd(name, description),

  "package.json": `{
  "name": "${name}",
  "version": "1.4.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "test": "vitest"
  }
}`,

  src: {
    "index.ts": `import express from 'express';
import { router } from './routes/main';

const app = express();
app.use(express.json());
app.use('/v1', router);
app.listen(3000, () => console.log('${name} on :3000'));`,

    routes: {
      "main.ts": src(name),
    },

    lib: {
      "db.ts": `export const db = {
  list: async (o: { limit: number }) => [],
  create: async (b: unknown) => ({ id: 'new', ...(b as object) }),
};`,
    },
  },

  tests: {
    "main.test.ts": `import { describe, it, expect } from 'vitest';

describe('${name}', () => {
  it('lists items', () => expect([]).toHaveLength(0));
});`,
  },

  Dockerfile: `FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci
CMD ["npm","start"]`,
});

const COMMITS = [
  ["Fix pagination off-by-one", "Dana Lee", "2h ago"],
  ["Add retry with backoff", "Priya Shah", "1d ago"],
  ["Bump dependencies", "Mia Chen", "3d ago"],
  ["Initial service scaffold", "Alex Morgan", "2w ago"],
];

const ep = (base: string, name: string) => [
  [
    "GET",
    `/v1/${base}`,
    `List ${name}`,
    "Bearer token",
    [
      ["limit", "query", "Max items (default 20)"],
      ["cursor", "query", "Pagination cursor"],
    ],
    null,
    {
      items: [{ id: `${base}_101`, name: "Sample" }],
      next: null,
    },
  ],
  [
    "GET",
    `/v1/${base}/{id}`,
    `Get one ${name} record`,
    "Bearer token",
    [["id", "path", "Record id"]],
    null,
    {
      id: `${base}_101`,
      name: "Sample",
      createdAt: "2026-10-01T09:00:00Z",
    },
  ],
  [
    "POST",
    `/v1/${base}`,
    `Create ${name} record`,
    "Bearer token + write scope",
    [],
    { name: "Sample" },
    { id: `${base}_102`, name: "Sample" },
  ],
];

const env = (repository: string) => [
  [
    "Prerequisites",
    `- Node.js 20 or newer
- Docker Desktop
- Access to the devhub GitHub org

\`\`\`
node -v
docker --version
\`\`\``,
  ],
  [
    "Installation",
    `\`\`\`
git clone git@github.com:devhub/${repository}.git
cd ${repository}
npm install
\`\`\``,
  ],
  [
    "Environment Variables",
    `\`\`\`
DATABASE_URL=postgres://localhost:5432/devhub
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me
\`\`\``,
  ],
  [
    "Running Locally",
    `\`\`\`
docker compose up -d db redis
npm run dev
# http://localhost:3000/health
\`\`\``,
  ],
  [
    "Troubleshooting",
    `- **Port in use:** run \`lsof -i :3000\` and stop the process
- **DB connection refused:** check \`docker compose ps\``,
  ],
];

const docs = (name: string) => [
  [
    "Getting Started",
    `# Getting started with ${name}

Welcome. This guide covers access and your first change.

## Request access

- Ask your manager for the Developer role
- Join the team channel

## First change

\`\`\`
git checkout -b my-first-change
npm test
\`\`\``,
  ],
  [
    "System Architecture",
    `# ${name} architecture

Clients call the API gateway, which routes to domain services. Services publish events to Kafka.

## Data ownership

- Each service owns its database
- Never read another service's tables`,
  ],
  [
    "Troubleshooting",
    `# Troubleshooting

## Tests fail locally

- Delete node_modules and reinstall
- Make sure Docker is running`,
  ],
];

const tasks = [
  "Request repository access",
  "Install prerequisites",
  "Run the project locally",
  "Read the architecture doc",
  "Review the API explorer",
  "Open your first pull request",
];

type ProjectInput = {
  id: string;
  name: string;
  description: string;
  status: string;
  tech: string[];
  team: string;
  repos: [string, string][];
  services: string[];
  apis: [string, string][];
  updated: string;
  pinned: boolean;
};

const P = (
  id: string,
  name: string,
  description: string,
  status: string,
  tech: string[],
  team: string,
  repos: [string, string][],
  services: string[],
  apis: [string, string][],
  updated: string,
  pinned: boolean,
) => ({
  id,
  name,
  d: description,
  st: status,
  tech,
  team,
  upd: updated,
  pin: pinned,

  repos: repos.map(([n, description]) => ({
    n,
    d: description,
    fs: mk(n, description),
  })),

  svcs: services,

  apis: apis.map(([name, base]) => ({
    n: name,
    eps: ep(base, name),
  })),

  env: env(repos[0][0]),
  docs: docs(name),
  tasks,
  commits: COMMITS,
});

export const PROJECTS = [
  P(
    "ecom",
    "E-Commerce Platform",
    "Storefront, cart and checkout for 40k daily shoppers.",
    "On track",
    ["React", "TypeScript", "PostgreSQL"],
    "Growth",
    [
      ["storefront-web", "React storefront"],
      ["commerce-api", "Catalog and cart API"],
      ["order-service", "Order lifecycle service"],
    ],
    ["Core API", "Payment Service", "Notification Service"],
    [
      ["Products API", "products"],
      ["Orders API", "orders"],
      ["Payments API", "payments"],
    ],
    "2h ago",
    true,
  ),

  P(
    "pay",
    "Payment Service",
    "Card payments, refunds and ledger reconciliation.",
    "At risk",
    ["Go", "Kafka", "PostgreSQL"],
    "Payments",
    [
      ["payment-gateway", "Card processing gateway"],
      ["ledger-service", "Double-entry ledger"],
    ],
    ["Core API", "Fraud Check", "Ledger"],
    [
      ["Charges API", "charges"],
      ["Refunds API", "refunds"],
    ],
    "Yesterday",
    true,
  ),

  P(
    "notif",
    "Notification Service",
    "Email, SMS and push delivery with retries.",
    "On track",
    ["Node.js", "Redis", "Kafka"],
    "Messaging",
    [
      ["notification-api", "Send API"],
      ["template-engine", "Template rendering"],
    ],
    ["Core API", "Email Worker", "Push Worker"],
    [
      ["Send API", "messages"],
      ["Templates API", "templates"],
    ],
    "3d ago",
    false,
  ),
];

export const NAV = [
  "Home",
  "Projects",
  "Services",
  "Teams",
  "API Directory",
  "Documentation",
  "Onboarding",
  "Engineering Insights",
  "Settings",
  "GitHub Repositories",
];
