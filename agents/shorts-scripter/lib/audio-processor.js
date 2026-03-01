import youtubedl from 'yt-dlp-exec';
import path from 'path';
import fs from 'fs';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ffmpeg 경로 고정 (워크스페이스 내부 bin 폴더)
const FFMPEG_PATH = 'C:\\linkdrop-workspace\\bin\\ffmpeg.exe';

/**
 * 유튜브 영상에서 오디오를 추출하고 OpenAI Whisper API를 통해 텍스트로 변환합니다.
 */
export async function getTranscriptViaSTT(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const outputDir = path.join(__dirname, '../temp');
  const outputPath = path.join(outputDir, `${videoId}.mp3`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    console.log(`[STT] 오디오 다운로드 중: ${videoId}...`);
    // yt-dlp를 사용하여 오디오 추출
    await youtubedl(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: path.join(outputDir, `${videoId}.%(ext)s`),
      noCheckCertificates: true,
      preferFreeFormats: true,
      noPlaylist: true,
      ffmpegLocation: FFMPEG_PATH, // 직접 경로 지정
    });

    console.log(`[STT] 음성 인식 진행 중 (OpenAI Whisper API)...`);
    // Whisper API 호출
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(outputPath),
      model: "whisper-1",
      language: "ko",
    });

    // 임시 파일 삭제
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    return transcription.text;
  } catch (error) {
    console.error(`[STT 오류] ${error.message}`);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    throw error;
  }
}
