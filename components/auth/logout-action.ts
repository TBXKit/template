"use server";

import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { clearAuthSession, getEffectiveUsername } from "@/lib/tebex/session";

// A plain Server Action reference works directly as a <form action> from a
// Server Component (components/header.tsx) — logout needs no pending/error
// UI, so there's no Client Component wrapper here, per AGENTS.md's Client
// Component convention (interactivity only where it's unavoidable).
export async function logoutAction(): Promise<void> {
  // Read before clearing purely so the log below can say who logged out.
  const username = await getEffectiveUsername();
  // See lib/tebex/session.ts's clearAuthSession doc comment for why this
  // clears the basket cookie too, not just the username.
  await clearAuthSession();
  logger.info({ username }, "Logout");
  revalidatePath("/", "layout");
}
