import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { env } from "../config/env.js";

const supabaseUrl = env.supabase?.url || process.env.SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseKey = env.supabase?.serviceKey || process.env.SUPABASE_SERVICE_ROLE_KEY || "YOUR_SUPABASE_SERVICE_KEY";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: {
    transport: ws as any
  }
});
