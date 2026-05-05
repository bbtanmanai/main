import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllHomepageItems } from "@/lib/homepage";
import "@/styles/pages/homepage.css";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const items = getAllHomepageItems();
  return items.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getAllHomepageItems().find((i) => i.slug === slug);
  if (!item) return {};
  return {
    title: `${item.title} 미리보기 | LinkDrop 홈페이지 소스`,
    description: `${item.category} 업종의 ${item.title}을 무료로 미리 확인하고 다운로드하세요.`,
  };
}

export default async function HomepagePreviewPage({ params }: Props) {
  const { slug } = await params;
  const item = getAllHomepageItems().find((i) => i.slug === slug);
  if (!item) notFound();

  return (
    <main className="hp-slug-main">
      <div className="hp-slug-container">
        {/* 상단 네비게이션 */}
        <div className="hp-slug-back-nav">
          <Link href="/homepage" className="hp-slug-back-link">
            ← 홈페이지 소스 목록
          </Link>
        </div>

        {/* 메인 그리드 */}
        <div className="hp-prev-grid">
          {/* 이미지 섹션 */}
          <div className="ld-glass hp-prev-image-card">
            {item.thumbnail ? (
              <div className="hp-slug-thumb-wrap">
                <Image
                  src={item.thumbnail}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  style={{ objectFit: "contain", objectPosition: "top center" }}
                  priority
                />
              </div>
            ) : (
              <div className="hp-slug-thumb-placeholder">
                <span className="hp-slug-thumb-placeholder-icon">🖼️</span>
              </div>
            )}

            {/* 라이브 미리보기 버튼 (이미지 하단) */}
            {item.previewUrl && (
              <div className="hp-slug-live-btn-wrap">
                <a
                  href={item.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hp-prev-live-link"
                >
                  <span>라이브 미리보기 열기</span>
                  <span className="hp-slug-live-new-tab">↗ 새 창</span>
                </a>
              </div>
            )}
          </div>

          {/* 정보 패널 */}
          <div className="hp-prev-info-panel">
            {/* 카테고리 */}
            <span className="hp-prev-category">{item.category}</span>

            {/* 타이틀 */}
            <h1 className="hp-prev-title">{item.title}</h1>

            {/* 태그 */}
            {item.tags.length > 0 && (
              <div className="hp-slug-tags">
                {item.tags.map((tag) => (
                  <span key={tag} className="hp-prev-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="hp-prev-divider" />

            {/* 포함 내용 */}
            <div className="hp-slug-includes-wrap">
              <p className="hp-slug-includes-label">포함 내용</p>
              <ul className="hp-prev-includes">
                <li>✓ 반응형 HTML/CSS/JS 소스 전체</li>
                <li>✓ 폰트 · 아이콘 · 이미지 에셋 포함</li>
                <li>✓ 상업적 이용 가능 라이선스</li>
                <li>✓ 무제한 프로젝트 활용</li>
              </ul>
            </div>

            {/* CTA 박스 */}
            <div className="ld-glass hp-prev-cta-box">
              <p className="hp-prev-cta-desc">
                LinkDrop 멤버십 가입 시<br />
                <strong>모든 홈페이지 소스를 무제한 다운로드</strong>할 수 있습니다.
              </p>

              <div className="hp-slug-cta-btns">
                <Link href="/checkout" className="hp-prev-btn-buy">
                  멤버십 시작하기 →
                </Link>

                {item.previewUrl && (
                  <a
                    href={item.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hp-prev-btn-preview"
                  >
                    라이브 미리보기 ↗
                  </a>
                )}

                {item.downloadUrl && (
                  <a
                    href={item.downloadUrl}
                    download
                    className="hp-prev-btn-download"
                  >
                    다운로드 (멤버 전용)
                  </a>
                )}
              </div>
            </div>

            {/* 슬러그 (보조 정보) */}
            <p className="hp-slug-slug-label">소스코드: {item.slug}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
