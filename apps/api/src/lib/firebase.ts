import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { env } from "../config/env.js";

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: env.firestore.projectId,
      clientEmail: env.firestore.clientEmail,
      privateKey: env.firestore.privateKey
    })
  });

export const db = getFirestore(app, env.firestore.databaseId);

