import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { credentialVersion, ownerSession, ownerSessionValid, passwordMatches, requireOwner, requireSameOrigin } from "./owner-gate.server";

export const getOwnerSession = createServerFn({ method: "GET" }).handler(async () => {
  const password = process.env['OWNER_PASSWORD'];
  const secret = process.env['OWNER_SESSION_SECRET'];
  if (!password || !secret) return { unlocked: false };
  const session = await ownerSession(secret);
  return { unlocked: ownerSessionValid(session.data, credentialVersion(password, secret)) };
});

export const unlockOwner = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ password: z.string().min(1).max(256) }).parse(input))
  .handler(async ({ data }) => {
    requireSameOrigin();
    const password = process.env['OWNER_PASSWORD'];
    const secret = process.env['OWNER_SESSION_SECRET'];
    if (!password || !secret) return { ok: false, error: "Owner access is not configured yet." };
    if (!passwordMatches(data.password, password)) return { ok: false, error: "Incorrect password." };
    const session = await ownerSession(secret);
    await session.update({ unlocked: true, version: credentialVersion(password, secret) });
    return { ok: true, error: null };
  });

export const getOwnerMessages = createServerFn({ method: "GET" }).handler(async () => {
  const password = process.env['OWNER_PASSWORD'];
  const secret = process.env['OWNER_SESSION_SECRET'];
  if (!password || !secret) throw new Error("Owner access is not configured.");
  await requireOwner(password, secret);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("contact_messages")
    .select("id,name,email,subject,message,created_at,is_read,email_status")
    .order("created_at", { ascending: false }).limit(500);
  if (error) throw new Error("Messages could not be loaded. Please try again.");
  return { messages: data ?? [] };
});

export const updateOwnerMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), isRead: z.boolean() }).parse(input))
  .handler(async ({ data }) => {
    requireSameOrigin();
    const password = process.env['OWNER_PASSWORD'];
    const secret = process.env['OWNER_SESSION_SECRET'];
    if (!password || !secret) throw new Error("Owner access is not configured.");
    await requireOwner(password, secret);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").update({ is_read: data.isRead }).eq("id", data.id);
    if (error) throw new Error("Message could not be updated.");
    return { ok: true };
  });

export const deleteOwnerMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    requireSameOrigin();
    const password = process.env['OWNER_PASSWORD'];
    const secret = process.env['OWNER_SESSION_SECRET'];
    if (!password || !secret) throw new Error("Owner access is not configured.");
    await requireOwner(password, secret);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").delete().eq("id", data.id);
    if (error) throw new Error("Message could not be deleted.");
    return { ok: true };
  });

export const lockOwner = createServerFn({ method: "POST" }).handler(async () => {
  requireSameOrigin();
  const secret = process.env['OWNER_SESSION_SECRET'];
  if (secret) await (await ownerSession(secret)).clear();
  return { ok: true };
});