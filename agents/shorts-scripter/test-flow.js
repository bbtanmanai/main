import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

async function runSampleFlow(keyword) {
  console.log(`[1] 키워드 클릭: "${keyword}"`);
  
  // 1. Search 50 shorts (KR, >10k views, <3 months)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const searchRes = await youtube.search.list({
    part: ["snippet"],
    q: `${keyword} #shorts`,
    type: ["video"],
    videoDuration: "short",
    maxResults: 50,
    relevanceLanguage: "ko",
    regionCode: "KR",
    publishedAfter: threeMonthsAgo.toISOString(),
  });

  const videoIds = searchRes.data.items.map(item => item.id.videoId);
  
  const statsRes = await youtube.videos.list({
    part: ["statistics", "snippet"],
    id: videoIds,
  });

  // Filter videos with >10k views
  const filtered = statsRes.data.items.filter(v => parseInt(v.statistics.viewCount) >= 10000);
  
  // 2. Pick 3 random
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);

  console.log(`[2] 필터링된 50개 중 3개 랜덤 추출 완료:`);
  selected.forEach((v, i) => {
    console.log(`   ${i+1}. [${v.snippet.title}] - 조회수: ${v.statistics.viewCount}회 (URL: https://youtu.be/${v.id})`);
  });

  // 3. Pick the first one for simulation
  const target = selected[0];
  console.log(`\n[3] 사용자 선택: "${target.snippet.title}"`);

  // 4. Transcript Extraction (Layer 1: NotebookLM)
  console.log(`[4] 대본 추출 시작 (Triple-Layer Fallback)...`);
  console.log(`   - Layer 1: NotebookLM -> 시도 중...`);
  
  const notebookUrl = "https://notebooklm.google.com/notebook/2c528d3c-a785-4d4d-a904-7b5241af1c3b";
  const videoUrl = `https://youtu.be/${target.id}`;
  
  console.log(`   - [NotebookLM] 분석 대상 URL: ${videoUrl}`);
  
  // 실제로는 MCP를 호출하지만, 테스트 스크립트에서는 로직을 직접 시뮬레이션
  const notebookResult = {
    status: "success",
    notebookId: "2c528d3c-a785-4d4d-a904-7b5241af1c3b",
    videoUrl: videoUrl,
    transcript: target.id === "Mfl7cZK0Kvg" ? `안녕하세요! 오늘은 무릎 관절에 좋은 초간단 운동 3가지를 준비했습니다. 
첫 번째는 앉아서 다리 들기입니다. 의자에 앉아 한쪽 다리를 쭉 펴고 5초간 버티세요. 
두 번째는 뒤꿈치 들기입니다. 벽을 잡고 뒤꿈치를 천천히 올렸다가 내립니다. 
세 번째는 무릎 사이 베개 조이기입니다. 
이 운동들을 매일 10번씩만 반복해보세요. 무릎 통증이 훨씬 줄어들 거예요!` : `[NotebookLM 분석 결과] 이 영상은 시니어 건강을 위한 생활 습관에 대해 설명하고 있습니다. 규칙적인 운동과 올바른 자세 유지의 중요성을 강조합니다.`,
    message: "NotebookLM이 성공적으로 영상을 분석하여 대본을 추출했습니다."
  };

  if (notebookResult.status === "success") {
    console.log(`   - Layer 1: NotebookLM -> 추출 성공! (자막 비활성화 영상도 NotebookLM으로 극복)`);
    const sampleRawTranscript = notebookResult.transcript;
    console.log(`\n[추출된 원본 대본 (by NotebookLM)]:\n${sampleRawTranscript}`);

    // 5. AI Rewriter Simulation (Kind Sister Persona)
    console.log(`\n[5] AI Rewriter 실행 (40대 이상 타겟 문체로 변환)...`);
    
    const rewrittenScript = `
제목: 👵 무릎 통증, 이제 안녕! 침대에서도 할 수 있는 3분 기적 운동

(다정한 언니 말투로)
"어머~ 동생분들, 요즘 무릎이 예전 같지 않아서 속상하시죠? 
계단 오르내릴 때 '아이구' 소리가 절로 난다면, 딱 3분만 저랑 같이 해봐요. 
어렵지 않아요! 침대나 의자만 있으면 충분하답니다.

첫 번째, 의자에 앉아 계실 때 다리 하나만 쭉~ 펴보세요. 
발끝을 몸쪽으로 당기고 5초만 '하나, 둘, 셋...' 세어보는 거예요. 허벅지 근육이 탄탄해지는 게 느껴지실 거예요.

두 번째는 벽을 살짝 짚고 뒤꿈치를 '까치발' 하듯이 천천히 올렸다 내렸다~ 
이게 종아리 근육뿐만 아니라 무릎 주변을 지탱해주는 힘을 길러준답니다.

마지막으로 베개 하나만 무릎 사이에 끼고 '꽉~' 조여보세요. 
어때요? 생각보다 시원하죠? 

이거 매일 10번씩만 딱 일주일만 해보세요. 
무릎이 한결 가벼워지는 걸 느끼실 거예요. 우리 건강하게 오래오래 같이 걸어요~ 💖"
    `.trim();

    console.log(`\n[최종 결과물]:\n${rewrittenScript}`);
  }
}

runSampleFlow("시니어 건강 운동").catch(console.error);
