"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function LdViewTransitionHandler() {
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!("startViewTransition" in document)) return;

    // 어드민·멤버·파트너 패널에서는 전환 효과 완전 비활성화
    if (pathname.startsWith("/admin") || pathname.startsWith("/member") || pathname.startsWith("/partner")) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      // 외부 링크, 해시 전용, _blank, 어드민·멤버·파트너 경로 제외
      if (link.target === "_blank") return;
      if (href.startsWith("http://") || href.startsWith("https://")) return;
      if (href.startsWith("#")) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (href.startsWith("/admin") || href.startsWith("/member") || href.startsWith("/partner")) return;

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
  }, [router, pathname]);

  return null;
}
