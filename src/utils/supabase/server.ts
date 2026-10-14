import { createServerClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://mlhqpppvglhoivzrcyhz.supabase.co";

const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_WeqcBfP4EoyxIgTF9OIjSg_5lJ6mf13";

export interface CookieMethodsServer {
  getAll: () => { name: string; value: string }[] | Promise<{ name: string; value: string }[]>;
  setAll?: (
    cookiesToSet: { name: string; value: string; options?: any }[]
  ) => void | Promise<void>;
}

export const createClient = (cookieStore?: CookieMethodsServer) => {
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        if (!cookieStore || typeof cookieStore.getAll !== "function") {
          return [];
        }
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        if (cookieStore && typeof cookieStore.setAll === "function") {
          try {
            cookieStore.setAll(cookiesToSet);
          } catch {
            // Handle server-component or readonly context
          }
        }
      },
    },
  });
};
