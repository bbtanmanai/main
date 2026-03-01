import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const YOUTUBE_MCP_PATH = path.join(__dirname, '../../../mcp-servers/youtube-mcp/index.js');

/**
 * 유튜브 쇼츠 정보 수집 모듈 (MCP 호출을 통한 데이터 수집)
 */
export async function searchShorts(keyword, limit = 50) {
    console.log(`[YouTube API 호출 중] 키워드: ${keyword}, 국가: KR, 기간: 3개월 이내`);
    
    try {
        const command = `node "${YOUTUBE_MCP_PATH}" search_shorts --keyword "${keyword}" --limit ${limit}`;
        const output = execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
        
        // JSON array 시작 부분을 찾습니다. [ 로 시작하고 그 뒤에 { 가 오는 경우를 찾습니다.
        const startIndex = output.indexOf('[{"');
        // 만약 검색 결과가 없을 경우 [] 가 올 수 있으므로 이에 대한 처리도 추가합니다.
        const emptyIndex = output.indexOf('[]');
        
        let finalStartIndex = -1;
        if (startIndex !== -1 && (emptyIndex === -1 || startIndex < emptyIndex)) {
            finalStartIndex = startIndex;
        } else if (emptyIndex !== -1) {
            finalStartIndex = emptyIndex;
        }

        const endIndex = output.lastIndexOf(']');
        
        if (finalStartIndex === -1 || endIndex === -1) {
            throw new Error("No valid JSON found in output. Raw output: " + output);
        }
        
        const jsonStr = output.substring(finalStartIndex, endIndex + 1);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error(`[YouTube 검색 오류] ${e.message}`);
        return [];
    }
}

/**
 * 유튜브 영상의 자막을 추출합니다.
 */
export async function getNativeTranscript(videoId) {
    try {
        const command = `node "${YOUTUBE_MCP_PATH}" get_transcript --videoId "${videoId}"`;
        const output = execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
        return output.trim();
    } catch (e) {
        console.log(`[YouTube 자막 추출 실패] ${e.message}`);
        return null;
    }
}
