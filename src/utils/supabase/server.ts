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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55b2VtcnpscWp0a3l4b3p4amNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMTY1MDUsImV4cCI6MjEwNzY5MjUwNX0.tt-0KIkkdGNYyUCV0LpweAv0XqvlxarTLI9ynaWoKIU";

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
