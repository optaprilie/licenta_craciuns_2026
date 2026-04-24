import { Router } from "express";

import { buildSignedUploadPayload } from "../lib/cloudinary.js";

const router = Router();

router.post("/signature", (_request, response) => {
  response.json(buildSignedUploadPayload());
});

export { router as uploadsRouter };

