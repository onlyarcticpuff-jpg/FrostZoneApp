import { createClient } from "@supabase/supabase-js";

const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const VITE_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

export async function saveTelegramUser() {
  try {
    const tg =
      (window as any).Telegram?.WebApp?.initDataUnsafe?.user;

    if (!tg?.id) {
      console.log("[TG] No Telegram user found");
      return null;
    }

    const payload = {
      telegram_id: tg.id,
      username: tg.username ?? null,
      first_name: tg.first_name ?? null,
      last_name: tg.last_name ?? null,
      photo_url: tg.photo_url ?? null,
      language_code: tg.language_code ?? null,
      is_premium: tg.is_premium ?? false,
      last_seen_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("users")
      .upsert(payload, {
        onConflict: "telegram_id",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[Supabase Save Error]", error);
      return null;
    }

    console.log("[TG User Saved]", data);

    return data;
  } catch (err) {
    console.error("[saveTelegramUser]", err);
    return null;
  }
}
