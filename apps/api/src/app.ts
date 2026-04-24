import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { mediaRouter } from "./routes/media.js";
import { uploadsRouter } from "./routes/uploads.js";

export const app = express();

app.use(
  cors({
    origin: env.clientOrigin
  })
);
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/media", mediaRouter);

app.use(
  (error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const message =
      error instanceof Error ? error.message : "An unexpected server error occurred.";

    response.status(500).json({
      message
    });
  }
);

