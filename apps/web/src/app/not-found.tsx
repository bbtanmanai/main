import type { Metadata } from "next";
import NotFoundContent from "./_components/NotFoundContent";

export const metadata: Metadata = {
  title: "404 — 페이지를 찾을 수 없습니다 | LinkDrop",
};

export default function NotFound() {
  return <NotFoundContent />;
}
