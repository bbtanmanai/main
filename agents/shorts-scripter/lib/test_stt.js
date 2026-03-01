import { getTranscriptViaSTT } from './audio-processor.js';

async function testSTT() {
  const videoId = 'esySpHm9Op0'; // 이전에 자막이 없어 실패했던 영상
  console.log(`[테스트 시작] 비디오 ID: ${videoId}`);
  
  try {
    const text = await getTranscriptViaSTT(videoId);
    console.log("\n[STT 변환 결과]");
    console.log("--------------------------------------------------");
    console.log(text);
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("\n[테스트 실패]", error.message);
  }
}

testSTT();
