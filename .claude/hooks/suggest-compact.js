#!/usr/bin/env node
/**
 * PreToolUse Hook: Strategic Compact Suggester (standalone)
 *
 * 도구 호출 횟수를 세다가 임계값(기본 50)에 도달하면
 * /compact 실행을 제안하는 메시지를 출력합니다.
 *
 * 외부 의존성 없음 — Node.js 내장 모듈만 사용
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const THRESHOLD = parseInt(process.env.COMPACT_THRESHOLD || '30', 10);
const REMINDER_INTERVAL = 25;

const sessionId = (process.env.CLAUDE_SESSION_ID || process.ppid || 'default')
  .toString()
  .replace(/[^a-zA-Z0-9_-]/g, '')
  .substring(0, 32) || 'default';

const counterFile = path.join(os.tmpdir(), `ld-compact-${sessionId}`);

function readCount() {
  try {
    const val = parseInt(fs.readFileSync(counterFile, 'utf8').trim(), 10);
    return Number.isFinite(val) && val > 0 ? val : 0;
  } catch {
    return 0;
  }
}

function writeCount(n) {
  try {
    fs.writeFileSync(counterFile, String(n), 'utf8');
  } catch {
    // 실패해도 무시 — 비필수 기능
  }
}

const count = readCount() + 1;
writeCount(count);

if (count === THRESHOLD) {
  console.error(`[CompactSuggester] 🗜️  도구 ${THRESHOLD}회 호출됨 — 단계 전환 전 /compact 고려`);
} else if (count > THRESHOLD && (count - THRESHOLD) % REMINDER_INTERVAL === 0) {
  console.error(`[CompactSuggester] 🗜️  도구 ${count}회 — 컨텍스트가 오래됐다면 /compact 권장`);
}

process.exit(0);
