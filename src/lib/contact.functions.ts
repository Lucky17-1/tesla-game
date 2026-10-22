import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(255),
  subject: z.enum(["General", "Correction", "Game feedback", "Partnership", "Other"]),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(0).optional().default(""), // honeypot — must stay empty
  startedAt: z.number(),
});

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Public endpoint: validates, filters spam, rate-limits, then stores the
 * message. Email notification is added once a sender domain is verified.
 */
export const submitContact = createServerFn({ method: "POST" })
  .validator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data }) => {
    // Bots: filled honeypot or submitted faster than a human could type.
    if (data.website || Date.now() - data.startedAt < 3000) {
      console.warn("contact: dropped as spam", { honeypot: !!data.website, ms: Date.now() - data.startedAt });
      return { ok: true as const }; // silently drop
    }
    const ip = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for") ?? "unknown";
    const clientHash = await sha256(`${ip}|voltedge-contact`);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("client_hash", clientHash)
      .gte("created_at", since);
    if ((count ?? 0) >= 3) {
      return { ok: false as const, error: "Too many messages. Please wait a few minutes and try again." };
    }

    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      client_hash: clientHash,
      email_status: "not_configured",
    });
    if (error) {
      console.error("contact insert failed", error.message);
      return { ok: false as const, error: "We couldn't save your message. Please try again later." };
    }
    // TODO(email): once the sender domain is verified, send the
    // "contact-notification" template to akilking.in@gmail.com here and
    // update email_status to "sent" / "failed".
    return { ok: true as const };
  });
