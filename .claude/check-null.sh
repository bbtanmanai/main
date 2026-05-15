#!/bin/bash
# ⚠️ 이 파일은 루트 잔류 사본입니다.
# 정식 위치: .claude/hooks/check-null.sh
# 사용법: bash .claude/hooks/check-null.sh <파일경로>

ROOT="/sessions/vigilant-zealous-goldberg/mnt/LinkDropV2"
TARGET="${1}"

# 절대경로가 아니면 V2 루트 기준으로 처리
if [[ ! "$TARGET" = /* ]]; then
    TARGET="${ROOT}/${TARGET}"
fi

python3 "${ROOT}/.claude/check-null.py" "$TARGET"
