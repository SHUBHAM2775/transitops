import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (_) {
    return false;
  }
};

export const supabase = isValidUrl(supabaseUrl)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        signUp: async () => ({ data: { user: null }, error: new Error("Supabase URL is not configured.") }),
        signInWithPassword: async () => ({ data: { user: null }, error: new Error("Supabase URL is not configured.") }),
      },
      from: () => ({
        select: async () => ({ data: [], error: new Error("Supabase URL is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local") })
      })
    } as any;