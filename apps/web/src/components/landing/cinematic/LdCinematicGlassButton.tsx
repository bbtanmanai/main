import Link from "next/link";

interface Props {
  label: string;
  href: string;
  kind?: "internal" | "external";
  size?: "md" | "lg";
  variant?: "primary" | "ghost";
  showIcon?: boolean;
}

export default function LdCinematicGlassButton({
  label,
  href,
  kind = "internal",
  size = "md",
  variant = "primary",
  showIcon = true,
}: Props) {
  const cls = [
    "ld-cine-btn",
    size === "lg" ? "ld-cine-btn--lg" : "",
    variant === "ghost" ? "ld-cine-btn--ghost" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span>{label}</span>
      {showIcon && variant !== "ghost" && (
        <span className="ld-cine-btn-icon">
          <svg viewBox="0 0 24 24">
            <path d="M21.89 14.08C22.23 13.87 22.51 13.56 22.7 13.2 22.9 12.83 23 12.42 23 12c0-.42-.1-.83-.3-1.2-.19-.36-.47-.67-.81-.88L6.33.32C5.99.11 5.61 0 5.22 0c-.39 0-.77.11-1.11.32-.34.21-.62.51-.83.88C3.1 1.57 3 1.98 3 2.4v19.2c0 .42.1.83.3 1.2.19.37.47.67.81.88.34.21.72.32 1.11.32.39 0 .77-.11 1.11-.32L21.89 14.08z"/>
          </svg>
        </span>
      )}
      {variant === "ghost" && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.75)">
          <path d="M21.89 14.08C22.23 13.87 22.51 13.56 22.7 13.2 22.9 12.83 23 12.42 23 12c0-.42-.1-.83-.3-1.2-.19-.36-.47-.67-.81-.88L6.33.32C5.99.11 5.61 0 5.22 0c-.39 0-.77.11-1.11.32-.34.21-.62.51-.83.88C3.1 1.57 3 1.98 3 2.4v19.2c0 .42.1.83.3 1.2.19.37.47.67.81.88.34.21.72.32 1.11.32.39 0 .77-.11 1.11-.32L21.89 14.08z"/>
        </svg>
      )}
    </>
  );

  if (kind === "external") {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      {content}
    </Link>
  );
}
