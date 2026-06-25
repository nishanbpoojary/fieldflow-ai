import "server-only";

import { createClient } from "@supabase/supabase-js";

import {
  resolveSupabaseAdminClientConfig,
  type SupabaseAdminClientConfig,
} from "./admin-config";
import type { Database } from "./database.types";

function getSupabaseAdminClientConfig(): SupabaseAdminClientConfig {
  return resolveSupabaseAdminClientConfig({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
  });
}

export function createSupabaseAdminClient() {
  const { supabaseUrl, supabaseSecretKey } = getSupabaseAdminClientConfig();

  return createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
