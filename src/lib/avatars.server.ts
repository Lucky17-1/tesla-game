import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
export const SEATS = ["Driver", "Front passenger", "Rear seat"] as const;

const avatarSchema = z.object({
  avatars: z.array(z.object({ seat: z.string(), name: z.string(), look: z.string(), outfit: z.string(), vibe: z.string() })),
});
export type AvatarDescription = z.infer<typeof avatarSchema>["avatars"][number];

export class AvatarError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function describeAvatars(riders: { seat: string; description: string }[]): Promise<AvatarDescription[]> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AvatarError(500, "AI is not configured on this server.");
  const provider = createOpenAI({ baseURL: GATEWAY, apiKey, headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" } });
  const list = riders.map((r) => `- ${r.seat}: ${r.description}`).join("\n");
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      instructions:
        "You design friendly, respectful 3D game avatars for people riding in a family car in a driving game. For each rider, return the same seat label, a short display name (max 3 words), look (face, hair, glasses; max 20 words), outfit (max 15 words) and vibe (pose/mood while seated; max 12 words). Never invent sensitive traits (religion, health, ethnicity). Reply in the language the rider descriptions use.",
      prompt: `Riders:\n${list}`,
      output: Output.object({ schema: avatarSchema }),
      providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
    });
    const output = await result.output;
    return output.avatars.slice(0, riders.length).map((a) => ({
      seat: a.seat.slice(0, 40), name: a.name.slice(0, 40), look: a.look.slice(0, 200), outfit: a.outfit.slice(0, 160), vibe: a.vibe.slice(0, 140),
    }));
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) throw new AvatarError(502, "The AI reply could not be read. Try again.");
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 429) throw new AvatarError(429, "Too many requests right now. Wait a minute and try again.");
    if (status === 402) throw new AvatarError(402, "AI credits are used up for this site.");
    if (status === 403) throw new AvatarError(403, "AI is not available for this site right now.");
    throw new AvatarError(502, "The AI service could not create avatars. Try again later.");
  }
}
