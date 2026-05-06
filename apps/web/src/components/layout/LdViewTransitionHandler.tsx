"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LdViewTransitionHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!("startViewTransition" in document)) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      // 외부 링크, 해시 전용, _blank 제외
      if (link.target === "_blank") return;
      if (href.startsWith("http://") || href.startsWith("https://")) return;
      if (href.startsWith("#")) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;

      e.preventDefault();
      e.stopPropagation();

      const url = href.startsWith("/") ? href : `/${href}`;

      (document as Document & { startViewTransition: (cb: () => void) => unknown }).startViewTransition(
        () => {
          router.push(url);
        }
      );
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [router]);

  return null;
}
