import "@/styles/pages/info-pages.css";

export default function PrivacyPage() {
  return (
    <div className="info-page-wrap">
      <h1 className="info-page-title">개인정보처리방침</h1>
      <p className="info-page-date">최종 업데이트: 2026년 5월 1일</p>

      {[
        {
          title: "1. 수집하는 개인정보 항목",
          body: "회사는 서비스 제공을 위해 다음 정보를 수집합니다.\n• 필수: 이름, 이메일 주소, 전화번호\n• 소셜 로그인 시: 카카오·구글 계정 식별자, 프로필 이미지(선택)\n• 자동 수집: 접속 IP, 브라우저 정보, 서비스 이용 기록, 다운로드 기록",
          pre: true,
        },
        {
          title: "2. 수집 목적",
          body: "• 회원 식별 및 본인 확인\n• 구매 콘텐츠 제공 및 다운로드 기록 관리\n• 환불 정책 준수 확인 및 법적 분쟁 대응\n• 파트너 수당 정산 및 CRM 관리\n• 서비스 공지·이벤트 안내",
          pre: true,
        },
        {
          title: "3. 보유 및 이용 기간",
          body: "• 회원 탈퇴 시까지 보유\n• 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간까지 보관\n  - 전자상거래법: 계약·청약 기록 5년, 대금 결제 기록 5년\n  - 통신비밀보호법: 접속 로그 3개월",
          pre: true,
        },
        {
          title: "4. 제3자 제공",
          body: "회사는 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다. 단, 법령의 규정에 의하거나 수사기관의 요구가 있는 경우에는 예외로 합니다.",
          pre: false,
        },
        {
          title: "5. 개인정보 보호책임자",
          body: "개인정보 관련 문의는 아래로 연락해주세요.\n• 이메일: privacy@linkdrop.kr\n• 운영시간: 평일 09:00 – 18:00",
          pre: true,
        },
        {
          title: "6. 권리 행사",
          body: "회원은 언제든지 자신의 개인정보를 조회·수정·삭제·처리 정지를 요청할 수 있습니다. 요청은 서비스 내 마이페이지 또는 이메일로 가능합니다.",
          pre: false,
        },
      ].map(({ title, body, pre }) => (
        <section key={title} className="info-page-section">
          <h2 className="info-page-h2">{title}</h2>
          <p className={`info-page-body${pre ? " info-page-body--pre" : ""}`}>{body}</p>
        </section>
      ))}
    </div>
  );
}
