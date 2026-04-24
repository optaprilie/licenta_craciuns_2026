import { v2 as cloudinary } from "cloudinary";

import { env } from "../config/env.js";

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true
});

export function buildSignedUploadPayload() {
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = {
    folder: env.cloudinary.folder,
    timestamp,
    use_filename: 1,
    unique_filename: 1,
    overwrite: 0
  };

  if (env.cloudinary.aiTaggingProvider) {
    paramsToSign.categorization = env.cloudinary.aiTaggingProvider;
    paramsToSign.auto_tagging = env.cloudinary.autoTaggingThreshold;
  }

  if (env.cloudinary.enableVideoDetails) {
    paramsToSign.auto_video_details = "true";
  }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.cloudinary.apiSecret
  );

  return {
    cloudName: env.cloudinary.cloudName,
    apiKey: env.cloudinary.apiKey,
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/auto/upload`,
    params: {
      ...paramsToSign,
      signature
    }
  };
}

export { cloudinary };
