"use client";

interface ClatLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export default function ClatLogo({ size = "md", showTagline = false }: ClatLogoProps) {
  const heights = { sm: 36, md: 56, lg: 80 };
  const h = heights[size];

  if (showTagline) {
    return (
      <img
        src="/clatians-logo.png"
        alt="CLATians"
        style={{ height: h * 1.4, width: "auto", objectFit: "contain" }}
      />
    );
  }

  return (
    <img
      src="/clatians-logo.png"
      alt="CLATians"
      style={{ height: h, width: "auto", objectFit: "contain" }}
    />
  );
}
