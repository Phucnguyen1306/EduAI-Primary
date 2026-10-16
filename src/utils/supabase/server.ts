import { createServerClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_EduAI_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://nyoemrzlqjtkyxozxjch.supabase.co";

const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_EduAI_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_EduAI_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_FiESbC5VgcMjvX-FagT0IQ_9SCm61JL";

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
