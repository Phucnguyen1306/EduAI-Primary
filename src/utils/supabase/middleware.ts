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

/**
 * Supabase session refresher helper for HTTP middleware & Express requests
 */
export const createMiddlewareClient = (req: {
  cookies?: Record<string, string>;
  headers?: any;
}) => {
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        if (!req.cookies) return [];
        return Object.entries(req.cookies).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll() {
        // In Express / client environments, cookies are handled by headers
      },
    },
  });
};
