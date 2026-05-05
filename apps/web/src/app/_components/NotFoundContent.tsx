"use client";

import "@/styles/pages/not-found.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const REDIRECT_SECONDS = 5;

export default function NotFoundContent() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (seconds <= 0) {
      router.push("/");
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, router]);

  return (
    <>
      <div className="nf-bg" aria-hidden="true" />
      <div className="nf-wrap">
        <p className="nf-number" aria-label="404">
          4<span className="nf-accent">0</span>4
        </p>
        <h1 className="nf-title">페이지를 찾을 수 없습니다</h1>
        <p className="nf-desc">요청하신 페이지가 이동되었거나 삭제되었습니다.</p>
        <Link href="/" className="nf-btn">
          홈으로 돌아가기
        </Link>
        <p className="nf-countdown">
          <span className="nf-countdown-num">{seconds}</span>초 후 자동으로 홈으로 이동합니다
        </p>
      </div>
    </>
  );
}
