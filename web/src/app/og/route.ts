import { createElement } from "react";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const title = (url.searchParams.get("title") || "GitTiger").slice(0, 120);
  const description = (
    url.searchParams.get("description") ||
    "Trending AI and developer-tool GitHub repositories, ranked daily by star velocity."
  ).slice(0, 220);
  const eyebrow = (url.searchParams.get("eyebrow") || "DEVELOPER TRENDS · DAILY RANKING").slice(0, 48);

  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "60px 70px",
          backgroundColor: "#020617",
          color: "#f8fafc",
          fontFamily: "sans-serif",
          position: "relative",
        },
      },
      createElement("div", {
        style: {
          position: "absolute",
          left: 0,
          top: 0,
          width: 12,
          height: "100%",
          background: "linear-gradient(180deg, #7c5cff, #22d3ee 58%, #22c55e)",
        },
      }),
      createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 48,
          },
        },
        createElement("div", {
          style: {
            display: "flex",
            width: 18,
            height: 18,
            borderRadius: 6,
            background: "linear-gradient(135deg, #7c5cff, #22d3ee)",
          },
        }),
        createElement(
          "span",
          { style: { fontSize: 20, fontWeight: 700, letterSpacing: "0.02em" } },
          "LOGIC MOSAIC TRENDS",
        ),
      ),
      createElement(
        "div",
        {
          style: {
            display: "flex",
            color: "#22d3ee",
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "0.14em",
            marginBottom: 22,
          },
        },
        eyebrow.toUpperCase(),
      ),
      createElement(
        "div",
        {
          style: {
            display: "flex",
            fontSize: title.length > 58 ? 48 : 62,
            lineHeight: 1.12,
            fontWeight: 700,
            letterSpacing: "-0.035em",
            maxWidth: 1030,
          },
        },
        title,
      ),
      createElement(
        "div",
        {
          style: {
            display: "flex",
            color: "#94a3b8",
            fontSize: 24,
            lineHeight: 1.45,
            marginTop: 24,
            maxWidth: 980,
          },
        },
        description,
      ),
      createElement(
        "div",
        {
          style: {
            display: "flex",
            marginTop: "auto",
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.12)",
            color: "#64748b",
            fontSize: 17,
            letterSpacing: "0.08em",
          },
        },
        "DISCOVER WHAT DEVELOPERS ARE BUILDING",
      ),
    ),
    SIZE,
  );
}
