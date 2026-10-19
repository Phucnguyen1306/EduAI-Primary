import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" &&
    (process.env.VITE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_EduAI_SUPABASE_URL)) ||
  "https://nyoemrzlqjtkyxozxjch.supabase.co";

const supabaseKey =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== "undefined" &&
    (process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_EduAI_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_EduAI_SUPABASE_ANON_KEY)) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55b2VtcnpscWp0a3l4b3p4amNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMTY1MDUsImV4cCI6MjEwNzY5MjUwNX0.tt-0KIkkdGNYyUCV0LpweAv0XqvlxarTLI9ynaWoKIU";

export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey);

export const supabaseBrowserClient = createClient();
