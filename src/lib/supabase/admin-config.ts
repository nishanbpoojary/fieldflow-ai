const ADMIN_CONFIG_ERROR_MESSAGE =
  "Supabase Admin client configuration is unavailable.";

export interface SupabaseAdminClientConfigInput {
  supabaseUrl?: string;
  supabaseSecretKey?: string;
}

export interface SupabaseAdminClientConfig {
  supabaseUrl: string;
  supabaseSecretKey: string;
}

export function resolveSupabaseAdminClientConfig({
  supabaseUrl,
  supabaseSecretKey,
}: SupabaseAdminClientConfigInput): SupabaseAdminClientConfig {
  const normalizedSupabaseUrl = supabaseUrl?.trim();
  const normalizedSupabaseSecretKey = supabaseSecretKey?.trim();

  if (!normalizedSupabaseUrl || !normalizedSupabaseSecretKey) {
    throw new Error(ADMIN_CONFIG_ERROR_MESSAGE);
  }

  return {
    supabaseUrl: normalizedSupabaseUrl,
    supabaseSecretKey: normalizedSupabaseSecretKey,
  };
}
