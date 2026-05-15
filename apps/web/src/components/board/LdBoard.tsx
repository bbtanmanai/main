"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownRight, Lock, X } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { createClient } from "@/lib/supabase";

export type PostStatus = "pending" | "reviewing" | "approved" | "rejected";

export interface BoardPost {
  id: number;
  title: string;
  author: string;
  date: string;
  status: PostStatus;
  hasReply: boolean;
}

interface LdBoardProps {
  posts: BoardPost[];
  pageSize?: number;
  applyHref?: string;
  backHref?: string;
}

function maskAuthor(name: string) {
  if (name.length <= 2) return name;
  return name.slice(0, 2) + "*".repeat(name.length - 2);
}

const STATUS_LABEL: Record<PostStatus, string> = {
  pending:   "검토대기",
  reviewing: "검토중",
  approved:  "승인",
  rejected:  "보류",
};

export default function LdBoard({
  posts,
  pageSize = 20,
  applyHref = "mailto:hello@linkdrop.kr",
  backHref = "#ch1",
}: LdBoardProps) {
  const router = useRouter();
  const { user, role } = useSession();
  const [page, setPage] = useState(1);
  const [popup, setPopup] = useState(false);
  const [loginPopup, setLoginPopup] = useState(false);
  const [guestPopup, setGuestPopup] = useState(false);
  const [applyForm, setApplyForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleApply(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (!user) {
      setLoginPopup(true);
    } else if (role === "guest") {
      setGuestPopup(true);
    } else {
      setFormError("");
      setFormSuccess(false);
      setApplyForm(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !formTitle.trim() || !formAuthor.trim() || !formContact.trim()) return;
    setSubmitting(true);
    setFormError("");

    const supabase = createClient();

    let attachment_url: string | null = null;
    if (formFile) {
      const ext = formFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("instructor-attachments")
        .upload(path, formFile, { upsert: false });
      if (uploadError) {
        setFormError("파일 업로드 중 오류가 발생했습니다. 다시 시도해주세요.");
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("instructor-attachments")
        .getPublicUrl(path);
      attachment_url = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("v2_instructor_applications")
      .insert({
        user_id: user.id,
        title: formTitle.trim(),
        content: formContent.trim() || null,
        author_name: formAuthor.trim(),
        contact: formContact.trim(),
        attachment_url,
      });

    setSubmitting(false);

    if (error) {
      if (error.code === "42501" || error.message?.includes("row-level security")) {
        setFormError("1분에 1회만 신청이 가능합니다. 잠시 후 다시 시도해주세요.");
      } else {
        setFormError("오류가 발생했습니다. 다시 시도해주세요.");
      }
      return;
    }

    setFormSuccess(true);
    router.refresh();
    setTimeout(() => {
      setApplyForm(false);
      setFormTitle("");
      setFormContent("");
      setFormAuthor("");
      setFormContact("");
      setFormFile(null);
      setFormSuccess(false);
    }, 2000);
  }

  function closeApplyForm() {
    setApplyForm(false);
    setFormError("");
    setFormSuccess(false);
    setFormContact("");
    setFormFile(null);
  }

  function openAuthModal() {
    setLoginPopup(false);
    window.dispatchEvent(new CustomEvent("ld-auth-open", {
      detail: { redirectTo: window.location.pathname },
    }));
  }
  const totalPages = Math.ceil(posts.length / pageSize);
  const slice = posts.slice((page - 1) * pageSize, page * pageSize);

  function goTo(p: number) {
    setPage(p);
    boardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {applyForm && (
        <div className="ct-popup-overlay" onClick={closeApplyForm}>
          <div className="ct-apply-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ct-apply-modal-head">
              <span className="ct-apply-modal-title">강사 신청하기</span>
              <button className="ct-apply-modal-close" onClick={closeApplyForm}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {formSuccess ? (
              <div className="ct-apply-success">
                <p>신청이 완료되었습니다.</p>
                <p>검토 후 순차적으로 안내드리겠습니다.</p>
              </div>
            ) : (
              <form className="ct-apply-form" onSubmit={handleSubmit}>
                <label className="ct-apply-label">
                  이름 / 닉네임
                  <input
                    className="ct-apply-input"
                    type="text"
                    placeholder=""
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    required
                    maxLength={20}
                  />
                </label>
                <label className="ct-apply-label">
                  연락처
                  <input
                    className="ct-apply-input"
                    type="text"
                    placeholder="이메일 또는 전화번호를 입력하세요"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    required
                    maxLength={100}
                  />
                </label>
                <label className="ct-apply-label">
                  제목
                  <input
                    className="ct-apply-input"
                    type="text"
                    placeholder=""
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    maxLength={100}
                  />
                </label>
                <label className="ct-apply-label">
                  내용
                  <textarea
                    className="ct-apply-textarea"
                    placeholder="강사 신청 내용을 자유롭게 작성해주세요"
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={4}
                    maxLength={2000}
                  />
                </label>
                <div className="ct-apply-label">
                  첨부파일 <span className="ct-apply-optional">(선택 · PDF·이미지 · 10MB 이하)</span>
                  <div className="ct-apply-file-row">
                    <button type="button" className="ct-apply-file-btn" onClick={() => fileRef.current?.click()}>
                      파일 선택
                    </button>
                    <span className="ct-apply-file-name">
                      {formFile ? formFile.name : "선택된 파일 없음"}
                    </span>
                    {formFile && (
                      <button type="button" className="ct-apply-file-clear" onClick={() => { setFormFile(null); if (fileRef.current) fileRef.current.value = ""; }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="ct-apply-file-input"
                    onChange={(e) => setFormFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                {formError && <p className="ct-apply-error">{formError}</p>}
                <div className="ct-apply-btn-row">
                  <button type="submit" className="ct-popup-close" disabled={submitting}>
                    {submitting ? "제출 중..." : "신청 제출"}
                  </button>
                  <button type="button" className="ct-popup-cancel" onClick={closeApplyForm}>
                    취소
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {guestPopup && (
        <div className="ct-popup-overlay" onClick={() => setGuestPopup(false)}>
          <div className="ct-popup" onClick={(e) => e.stopPropagation()}>
            <Lock size={20} strokeWidth={2} className="ct-popup-icon" />
            <p className="ct-popup-msg">파트너 회원 이상만 강사 신청이 가능합니다</p>
            <button className="ct-popup-close" onClick={() => setGuestPopup(false)}>확인</button>
          </div>
        </div>
      )}

      {loginPopup && (
        <div className="ct-popup-overlay" onClick={() => setLoginPopup(false)}>
          <div className="ct-popup" onClick={(e) => e.stopPropagation()}>
            <Lock size={20} strokeWidth={2} className="ct-popup-icon" />
            <p className="ct-popup-msg">로그인 후 강사 신청이 가능합니다</p>
            <div className="ct-popup-btn-row">
              <button className="ct-popup-close" onClick={openAuthModal}>로그인</button>
              <button className="ct-popup-cancel" onClick={() => setLoginPopup(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {popup && (
        <div className="ct-popup-overlay" onClick={() => setPopup(false)}>
          <div className="ct-popup" onClick={(e) => e.stopPropagation()}>
            <Lock size={20} strokeWidth={2} className="ct-popup-icon" />
            <p className="ct-popup-msg">작성자와 관리자만 열람 가능합니다</p>
            <button className="ct-popup-close" onClick={() => setPopup(false)}>확인</button>
          </div>
        </div>
      )}
      <div ref={boardRef} className="ct-board-actions">
        <span className="ct-board-count">총 {posts.length}건</span>
        <div className="ct-board-btn-row">
          <a href={applyHref} className="ct-board-btn-primary" onClick={handleApply}>강사 신청하기</a>
          <a href={backHref} className="ct-board-btn-ghost">신청 기준 보기 ↑</a>
        </div>
      </div>

      <div className="ct-board">
        <div className="ct-board-head">
          <span>번호</span>
          <span>제목</span>
          <span>작성자</span>
          <span>날짜</span>
          <span>상태</span>
        </div>

        {slice.map((post) => (
          <div key={post.id} className="ct-board-row">
            <div className="ct-board-row-main">
              <span className="ct-board-num">{post.id}</span>
              <button className="ct-board-title" onClick={() => setPopup(true)}>
                <Lock size={12} strokeWidth={2.5} className="ct-board-lock-icon" />
                {post.title}
              </button>
              <span className="ct-board-author">{maskAuthor(post.author)}</span>
              <span className="ct-board-date">{post.date}</span>
              <span className="ct-status-badge" data-status={post.status}>
                {STATUS_LABEL[post.status]}
              </span>
            </div>
            {post.hasReply && (
              <div className="ct-board-reply-line">
                <CornerDownRight size={13} strokeWidth={2.5} />
                답변완료
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="ct-pagination">
        <button
          className={`ct-page-btn ${page === 1 ? "ct-page-btn--disabled" : ""}`}
          onClick={() => goTo(page - 1)}
          disabled={page === 1}
        >◀</button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            className={`ct-page-btn ${p === page ? "ct-page-btn--active" : ""}`}
            onClick={() => goTo(p)}
          >{p}</button>
        ))}

        <button
          className={`ct-page-btn ${page === totalPages ? "ct-page-btn--disabled" : ""}`}
          onClick={() => goTo(page + 1)}
          disabled={page === totalPages}
        >▶</button>
      </div>
    </>
  );
}
