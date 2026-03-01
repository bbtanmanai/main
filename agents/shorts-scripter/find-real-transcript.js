import { YoutubeTranscript } from "youtube-transcript";
import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

async function findVideoWithTranscript(keyword) {
  const searchRes = await youtube.search.list({
    part: ["snippet"],
    q: `${keyword} #shorts`,
    type: ["video"],
    videoDuration: "short",
    maxResults: 10,
    relevanceLanguage: "ko",
    regionCode: "KR",
    videoCaption: "closedCaption", // 자막이 있는 영상만 검색 시도
  });

  for (const item of searchRes.data.items) {
    const videoId = item.id.videoId;
    console.log(`Checking video: ${videoId} (${item.snippet.title})`);
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'ko' });
      if (transcript && transcript.length > 0) {
        console.log(`✅ Found transcript for: ${videoId}`);
        return { videoId, title: item.snippet.title, transcript: transcript.map(t => t.text).join(" ") };
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
}

findVideoWithTranscript("시니어 건강").then(res => {
  if (res) {
    console.log("\n[SUCCESS] REAL DATA FOUND:");
    console.log(`Video ID: ${res.videoId}`);
    console.log(`Title: ${res.title}`);
    console.log(`Transcript: ${res.transcript.substring(0, 100)}...`);
  } else {
    console.log("\n[FAIL] No videos with accessible transcripts found.");
  }
}).catch(console.error);
