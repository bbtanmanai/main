/**
 * shorts-scripter 에이전트
 * 
 * [시나리오]
 * 1. 키워드 기반 유튜브 쇼츠 50개 정보 수집
 * 2. 조건에 맞는 쇼츠 3개 큐레이션 및 사용자 제안
 * 3. 선택된 쇼츠의 대본(Transcript) 추출 (Triple-Layer Fallback)
 * 4. 40대 이상 타겟에 맞춘 대본 재작성 (LLM 활용)
 */

import { searchShorts, getNativeTranscript } from "./lib/youtube.js";
import { getTranscriptViaSTT } from "./lib/audio-processor.js";
import { rewriteScript } from "./lib/ai-rewriter.js";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOTEBOOK_MCP_PATH = path.join(__dirname, "../../mcp-servers/notebooklm-audio-mcp/index.js");

/**
 * [에러 제로 하이브리드 로직]
 * 3중 방어막을 통해 대본을 추출합니다.
 */
async function getFullTranscript(videoId, notebookUrl) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  // 1단계: NotebookLM 시도 (가장 지능적)
  try {
    console.log(`[1단계] NotebookLM 분석 시도 중...`);
    const command = `node "${NOTEBOOK_MCP_PATH}" extract_youtube_transcript "${videoUrl}" "${notebookUrl || ''}"`;
    const result = execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    if (result && result.trim()) return result.trim();
  } catch (e) {
    console.log(`[안내] NotebookLM 분석 실패 또는 소스 없음: ${e.message}`);
  }

  // 2단계: YouTube 공식 자막 시도 (가장 빠름)
  try {
    console.log(`[2단계] 유튜브 공식 자막 추출 시도 중...`);
    const transcript = await getNativeTranscript(videoId);
    if (transcript) return transcript;
  } catch (e) {
    console.log(`[안내] 공식 자막을 찾을 수 없습니다: ${e.message}`);
  }

  // 3단계: OpenAI Whisper / 로컬 STT (최종 보루)
  try {
    console.log(`[3단계] 영상 소리 분석 중 (마지막 수단)...`);
    const text = await getTranscriptViaSTT(videoId);
    return text;
  } catch (e) {
    console.error(`[심각] 모든 대본 추출 단계가 실패했습니다: ${e.message}`);
    return "대본을 추출할 수 없습니다. 영상 링크를 확인해 주세요.";
  }
}

async function main() {
  const keyword = "시니어 운동"; 
  const userNotebookUrl = ""; // 필요 시 사용자 노트북 주소

  console.log(`\n[shorts-scripter] '${keyword}' 키워드로 쇼츠 시나리오를 시작합니다.`);

  // 1. 유튜브 쇼츠 검색 (최근 3개월, 조회수 1만 이상)
  const allShorts = await searchShorts(keyword, 50);
  const filteredShorts = allShorts.filter(video => video.viewCount >= 10000);
  
  if (filteredShorts.length === 0) {
    console.log("조건에 맞는 영상을 찾지 못했습니다.");
    return;
  }

  // 3개 랜덤 추출
  const randomThree = filteredShorts.sort(() => 0.5 - Math.random()).slice(0, 3);

  console.log("\n[큐레이션 결과 - 추천 영상 3선]");
  randomThree.forEach((video, index) => {
    console.log(`${index + 1}. [${video.viewCount.toLocaleString()}회] ${video.title} (ID: ${video.videoId})`);
  });

  // 2. 대본 추출 (3중 방어막 로직 적용)
  const selectedVideo = randomThree[0]; 
  console.log(`\n['${selectedVideo.title}'] 대본 분석을 시작합니다...`);
  
  const originalTranscript = await getFullTranscript(selectedVideo.videoId, userNotebookUrl);
  
  console.log("\n[원본 대본 추출 완료]");
  console.log("--------------------------------------------------");
  console.log(originalTranscript.substring(0, 300) + "..."); 
  console.log("--------------------------------------------------");

  // 3. AI 재작성 (40대 이상 타겟)
  console.log("\n[AI Rewriter] 시니어 친화적 문체로 재작성 중...");
  const rewrittenScript = await rewriteScript(originalTranscript, {
    title: selectedVideo.title,
    target: "40대 이상 여성 및 시니어"
  });

  console.log("\n[최종 결과물]");
  console.log("==================================================");
  console.log(rewrittenScript);
  console.log("==================================================");
}

if (import.meta.url === `file://${fileURLToPath(import.meta.url)}` || process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
