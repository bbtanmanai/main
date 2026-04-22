# 100. LinkDrop V3 — YouTube 배포 전략

**최초 작성: 2026-04-20**

---

## 확정 결정

### SFX / BGM
- **자동화 포기** — 파일 라이선스 불명확 + 룰 기반 매칭 만족도 20~30% 수준
- **수동 작업** — 사용자가 별도로 직접 작업
- 현재 25개 OGG + `sfx_rules.json` + `_mix_sfx_only()` 코드는 보존 (Phase 2 재활용 여지)

### YouTube 영상 자동 업로드
- **구현 계획 있음** — YouTube Data API v3 `videos.insert` + OAuth2 연동
- 자막 자동 업로드(`captions.insert`)는 같은 OAuth2 토큰으로 추가 비용 없이 가능

### 다국어 채널 전략 — **언어별 별도 채널**
- 단일 채널 + 자막 방식 기각: YouTube 알고리즘이 오디오 언어 기준으로 추천 → EN/JP 자막이 있어도 영어권/일본어권 노출 거의 없음
- **MrBeast 모델** 채택: 동일 영상을 언어별 채널로 분리 운영

```
KR 채널: ch01_final.mp4 (KR 오디오) + ch01_kr.srt
EN 채널: ch01_final_en.mp4            + ch01_en.srt
JP 채널: ch01_final_jp.mp4            + ch01_jp.srt
```

---

## MVP 로드맵

| 단계 | 채널 | 오디오 | 자막 |
|------|------|--------|------|
| **지금** | KR 1개 | KR TTS | KR SRT |
| **Phase 2** | EN 추가 | KR 오디오 유지 | EN SRT만 |
| **Phase 3** | EN 풀 | EN TTS 더빙 | EN SRT |
| **Phase 4** | JP 추가 | JP TTS 더빙 | JP SRT |

Phase 2: EN 오디오 없이 시작해도 채널 구조 선확립이 우선.

---

## 미구현 항목 (향후 설계 필요)

| 항목 | 내용 |
|------|------|
| SRT 챕터 병합 | 컷별 SRT(타임스탬프 0 시작) → 챕터 전체 SRT(오프셋 누적) 변환 함수 |
| EN/JP SRT 생성 | KR SRT 텍스트 → Gemini Free 번역 → EN/JP SRT |
| YouTube OAuth2 연동 | `videos.insert` + `captions.insert` / 채널 ID 환경변수 분리 |
| DB 컬럼 (v3_chapters) | `srt_kr_url`, `srt_en_url`, `srt_jp_url` (챕터 단위) |

---

## 절대 하지 말 것

- 단일 채널에 다국어 자막 트랙만 추가하는 방식으로 설계 — 알고리즘 노출 없음
- SFX 자동화 재도전 — 파일 라이선스 해결 전까지 보류
