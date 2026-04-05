import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

let browserClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}
