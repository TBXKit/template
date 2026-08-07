import Image from "next/image";

/**
 * Renders nothing outside a Minecraft store: Steam avatars require calling
 * Steam's own Web API with a server-held key just to resolve a profile image
 * URL, and FiveM has no equivalent per-player image source at all — neither
 * is implemented (see ROADMAP.md 14.2). Minecraft's case needs no server
 * round-trip or secret: mc-heads.net renders a face straight from a
 * username, which is the only player identifier this app ever holds.
 *
 * mc-heads.net was chosen over the alternatives after checking each
 * directly: crafatar.com (the best-known option) returned a live HTTP 521
 * error when checked, and works best with a UUID this app doesn't have;
 * minotar.net's own docs specifically warn that username-based lookups —
 * the only kind this app can make — are more likely to be rate-limited.
 * None of the three publish a real privacy policy on what they log from a
 * request; that tradeoff was accepted deliberately, not overlooked.
 */
export function PlayerAvatar({
  username,
  platformType,
  size = 24,
}: {
  username: string;
  platformType: string;
  size?: number;
}) {
  if (!platformType.includes("Minecraft")) return null;

  return (
    <Image
      // alt="" is deliberate: this always renders directly beside the same
      // username as visible text (e.g. "Signed in as {username}"),
      // matching header.tsx's own webstore-logo image for the same reason.
      src={`https://mc-heads.net/avatar/${encodeURIComponent(username)}/${size}`}
      alt=""
      width={size}
      height={size}
      unoptimized
      className="rounded-sm"
    />
  );
}
