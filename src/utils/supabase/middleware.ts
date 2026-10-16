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
