import "@/styles/pages/info-pages.css";

export default function RefundPage() {
  return (
    <div className="info-page-wrap">
      <h1 className="info-page-title">환불정책</h1>
      <p className="info-page-date">최종 업데이트: 2026년 5월 1일</p>

      {[
        {
          title: "1. 환불 불가 원칙",
          body: "디지털 콘텐츠(전자책, 영상, 자료 파일 등)는 다운로드 또는 열람 즉시 재화의 복원이 불가하므로, 콘텐츠를 1개 이상 다운로드한 경우 환불이 불가합니다. 이는 전자상거래 등에서의 소비자보호에 관한 법률 제17조 제2항 제5호에 따른 것입니다.",
          pre: false,
        },
        {
          title: "2. 환불 가능 조건",
          body: "다운로드 이력이 전혀 없는 경우에 한해 결제일로부터 7일 이내 환불 신청이 가능합니다.\n\n환불 신청 방법: 이메일(support@linkdrop.kr)로 주문번호와 환불 사유를 보내주세요.\n처리 기간: 영업일 기준 3~5일 이내 처리됩니다.",
          pre: true,
        },
        {
          title: "3. 다운로드와 환불 잠금",
          body: "콘텐츠 다운로드 시 본인 확인(전화번호·이메일) 및 환불 불가 동의 절차가 진행됩니다. 동의 완료 시점부터 해당 계정은 환불 불가 상태로 전환되며, 이 기록은 보관됩니다.",
          pre: false,
        },
        {
          title: "4. 결제 오류·이중 결제",
          body: "회사 측 오류로 이중 결제가 발생한 경우 전액 환불합니다. 결제 오류 확인 후 영업일 기준 3일 이내 처리됩니다.",
          pre: false,
        },
        {
          title: "5. 문의",
          body: "환불 관련 문의는 아래로 연락해주세요.\n• 이메일: support@linkdrop.kr\n• 운영시간: 평일 09:00 – 18:00",
          pre: true,
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
