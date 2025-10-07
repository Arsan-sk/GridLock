// Server-only Supabase client — uses SUPABASE_SERVICE_ROLE_KEY (keep secret)
import { createClient } from '@supabase/supabase-js';

// Server-only: read from process.env (do NOT expose SERVICE_ROLE key to client)
const url = process.env.SUPABASE_URL as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!url || !serviceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment.');
}

// Use only in server code (API routes, scripts). Never import into client bundles.
export const supabaseAdmin = createClient(url, serviceKey);