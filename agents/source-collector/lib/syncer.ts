
import { RefinedData, CORE_THEMES } from "../types.ts";

/**
 * Google Drive 동기화 관리자
 */
export class Syncer {
  /**
   * 정제된 데이터를 Google Drive에 파일로 업로드
   */
  async syncToDrive(data: RefinedData[]): Promise<void> {
    const GOOGLE_SERVICE_ACCOUNT_KEY = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    
    if (!GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.warn("GOOGLE_SERVICE_ACCOUNT_KEY가 설정되지 않았습니다. 동기화를 건너뜁니다.");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    for (const item of data) {
      const themeConfig = CORE_THEMES[item.theme];
      const filename = `${themeConfig.id}_${themeConfig.name}_${today}.txt`;
      const content = `
        제목: ${item.title}
        점수: ${item.score}
        인사이트: ${item.insight}
        ---
        요약:
        ${item.summary}
        ---
        출처: ${item.source} (${item.link})
      `;

      try {
        await this.uploadToDrive(filename, content, themeConfig.folderId);
      } catch (error) {
        console.error(`Error syncing ${filename} to Drive:`, error);
      }
    }
  }

  /**
   * Google Drive API를 호출하여 파일 업로드
   */
  private async uploadToDrive(filename: string, content: string, folderId: string): Promise<void> {
    // 1단계: 액세스 토큰 획득 (서비스 계정 JSON 활용)
    // 2단계: 파일 생성 API 호출
    console.log(`[Drive Sync] 파일 업로드 시도: ${filename} (Folder: ${folderId || "Root"})`);
    
    // TODO: 실제 Google Drive API 연동 로직 구현 (JWT 기반 인증)
    // 현재는 로그만 남깁니다.
  }
}
