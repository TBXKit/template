import { ImageResponse } from "next/og";
import { getWebstore } from "@/lib/tebex";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Storefront preview";

export default async function Image() {
  const webstore = await getWebstore();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        background: "#0a0a0a",
        color: "#ededed",
      }}
    >
      {webstore.logo ? (
        // next/og renders via Satori, not the DOM — next/image can't be used here.
        // biome-ignore lint/performance/noImgElement: required by next/og's ImageResponse renderer
        <img
          src={webstore.logo}
          width={120}
          height={120}
          alt=""
          style={{ borderRadius: 24 }}
        />
      ) : null}
      <div style={{ fontSize: 64, fontWeight: 600 }}>{webstore.name}</div>
      {webstore.description ? (
        <div
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            maxWidth: 900,
            textAlign: "center",
          }}
        >
          {webstore.description}
        </div>
      ) : null}
    </div>,
    size,
  );
}
