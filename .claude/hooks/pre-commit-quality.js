#!/usr/bin/env node
/**
 * PreToolUse Hook: Pre-commit Quality Check (LinkDrop 전용)
 *
 * git commit 실행 전:
 *  - 스테이징된 파일에서 secrets 패턴 감지 → 차단
 *  - console.log / debugger 감지 → 경고
 *  - 커밋 메시지 형식 검사 (conventional commits)
 *
 * Exit codes:
 *   0 — 통과 (커밋 허용)
 *   2 — 차단 (secrets 발견)
 */

const { spawnSync } = require('child_process');

function getStagedFileContent(filePath) {
  const r = spawnSync('git', ['show', `:${filePath}`], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout : null;
}

function getStagedFiles() {
  const r = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], { encoding: 'utf8' });
  if (r.status !== 0) return [];
  return r.stdout.trim().split('\n').filter(Boolean);
}

const CHECKABLE_EXT = ['.js', '.jsx', '.ts', '.tsx', '.py'];
const SECRET_PATTERNS = [
  { re: /sk-[a-zA-Z0-9]{20,}/, name: 'OpenAI API key' },
  { re: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub PAT' },
  { re: /AKIA[A-Z0-9]{16}/, name: 'AWS Access Key' },
  { re: /AIza[0-9A-Za-z\-_]{35}/, name: 'Google API Key' },
  { re: /api[_-]?key\s*[=:]\s*['"][a-zA-Z0-9\-_]{16,}['"]/i, name: 'API Key 하드코딩' },
  { re: /supabase.*anon.*key.*=.*['"](eyJ[a-zA-Z0-9]{20,})['"]/i, name: 'Supabase Anon Key' },
];

function checkFile(filePath) {
  const content = getStagedFileContent(filePath);
  if (!content) return { errors: [], warnings: [] };

  const errors = [];
  const warnings = [];

  content.split('\n').forEach((line, i) => {
    const lineNum = i + 1;
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) return;

    // secrets → error (차단)
    for (const { re, name } of SECRET_PATTERNS) {
      if (re.test(line)) {
        errors.push(`  ❌ Line ${lineNum}: ${name} 노출 가능성`);
      }
    }

    // console.log → warning
    if (line.includes('console.log')) {
      warnings.push(`  ⚠️  Line ${lineNum}: console.log`);
    }

    // debugger → error
    if (/\bdebugger\b/.test(line)) {
      errors.push(`  ❌ Line ${lineNum}: debugger 구문`);
    }
  });

  return { errors, warnings };
}

function validateCommitMessage(command) {
  const m = command.match(/(?:-m|--message)\s+["']?([^"'\n]+)["']?/);
  if (!m) return null;
  const msg = m[1];
  const issues = [];
  if (!/^(feat|fix|refactor|docs|test|chore|build|ci|perf|revert|style|security)(\(.+\))?:\s*.+/.test(msg)) {
    issues.push(`커밋 메시지 형식 오류 — 예: feat(auth): 로그인 추가`);
  }
  if (msg.length > 72) {
    issues.push(`커밋 메시지 너무 김 (${msg.length}자, 최대 72자)`);
  }
  return issues;
}

function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { raw += chunk; });
  process.stdin.on('end', () => {
    try {
      const input = JSON.parse(raw || '{}');
      const command = input.tool_input?.command || '';

      if (!command.includes('git commit') || command.includes('--amend')) {
        process.stdout.write(raw);
        process.exit(0);
      }

      const staged = getStagedFiles();
      if (staged.length === 0) {
        process.stdout.write(raw);
        process.exit(0);
      }

      console.error(`[품질 검사] 스테이징된 파일 ${staged.length}개 검사 중...`);

      let totalErrors = 0;
      let totalWarnings = 0;

      for (const f of staged) {
        if (!CHECKABLE_EXT.some(ext => f.endsWith(ext))) continue;
        const { errors, warnings } = checkFile(f);
        if (errors.length || warnings.length) {
          console.error(`\n📁 ${f}`);
          errors.forEach(e => console.error(e));
          warnings.forEach(w => console.error(w));
        }
        totalErrors += errors.length;
        totalWarnings += warnings.length;
      }

      const msgIssues = validateCommitMessage(command);
      if (msgIssues && msgIssues.length) {
        console.error('\n📝 커밋 메시지:');
        msgIssues.forEach(i => console.error(`  ⚠️  ${i}`));
        totalWarnings += msgIssues.length;
      }

      if (totalErrors > 0) {
        console.error(`\n[품질 검사] ❌ ${totalErrors}개 오류 발견 — 커밋 차단. 수정 후 재시도하세요.`);
        process.stdout.write(raw);
        process.exit(2);
      } else if (totalWarnings > 0) {
        console.error(`\n[품질 검사] ⚠️  ${totalWarnings}개 경고 (커밋은 허용). 가능하면 수정하세요.`);
      } else {
        console.error('\n[품질 검사] ✅ 통과');
      }

    } catch (e) {
      console.error(`[품질 검사] 오류: ${e.message}`);
    }

    process.stdout.write(raw);
    process.exit(0);
  });
}

main();
