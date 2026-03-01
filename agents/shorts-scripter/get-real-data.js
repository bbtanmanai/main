import { YoutubeTranscript } from "youtube-transcript";

async function getRealTranscript(videoId) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'ko' });
    const fullText = transcript.map(t => t.text).join(" ");
    console.log(fullText);
  } catch (e) {
    console.error("Error fetching transcript:", e.message);
  }
}

getRealTranscript("n0J5qde8XT4");
