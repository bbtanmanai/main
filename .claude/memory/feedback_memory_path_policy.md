---
name: 메모리 파일 저장 경로 확정
description: 메모리 개별 파일은 C:\LinkDropV2\.claude\memory\ 에만 저장한다
type: feedback
---

메모리 개별 파일은 반드시 `C:\LinkDropV2\.claude\memory\` 에 저장한다.

**Why:** 시스템 기본 경로(`C:\Users\User\.claude\projects\c--LinkDropV2\memory\`)와 혼용되어 파일이 소실된 전례가 있다. 사용자가 2026-05-06 명시적으로 이 경로를 확정했다.

**How to apply:** 새 메모리 파일 작성 시 항상 `C:\LinkDropV2\.claude\memory\{파일명}.md` 경로 사용. MEMORY.md 인덱스는 `C:\Users\User\.claude\projects\c--LinkDropV2\memory\MEMORY.md`에 유지하되, 파일 본문의 링크 경로는 `C:\LinkDropV2\.claude\memory\` 기준으로 작성.
