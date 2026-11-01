import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({
  riders: z.array(z.object({ seat: z.string().min(1).max(40), description: z.string().trim().min(3).max(400) })).min(1).max(3),
});

export const createAvatarDescriptions = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }) => {
    const { describeAvatars, AvatarError } = await import("./avatars.server");
    try {
      return { ok: true as const, avatars: await describeAvatars(data.riders) };
    } catch (error) {
      if (error instanceof AvatarError) return { ok: false as const, error: error.message };
      return { ok: false as const, error: "Something went wrong. Try again." };
    }
  });
