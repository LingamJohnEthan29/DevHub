import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import githubRoutes from "./routes/github.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  }),
);
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "DevHub API" });
});

app.use("/api/github", githubRoutes);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ message: "Unexpected server error." });
  },
);

const port = Number(process.env.PORT ?? 4000);

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`DevHub API running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start DevHub API:", error);
    process.exit(1);
  });
