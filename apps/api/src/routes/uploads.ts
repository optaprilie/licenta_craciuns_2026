import { Router } from "express";

import { buildSignedUploadPayload } from "../lib/cloudinary.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/signature", requireAuth, (_request, response) => {
  response.json(buildSignedUploadPayload());
});

export { router as uploadsRouter };

