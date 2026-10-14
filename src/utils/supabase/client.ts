import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" &&
    (process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)) ||
  "https://mlhqpppvglhoivzrcyhz.supabase.co";

const supabaseKey =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== "undefined" &&
    (process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) ||
  "sb_publishable_WeqcBfP4EoyxIgTF9OIjSg_5lJ6mf13";

export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey);

export const supabaseBrowserClient = createClient();
