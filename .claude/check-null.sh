#!/bin/bash
# check-null.sh — null bytes 검사 래퍼
# 사용법: bash scripts/check-null.sh apps/web/src/components/landing/LdAffiliateGuide.tsx

ROOT="/sessions/vigilant-zealous-goldberg/mnt/LinkDropV2"
TARGET="${1}"

# 절대경로가 아니면 V2 루트 기준으로 처리
if [[ ! "$TARGET" = /* ]]; then
    TARGET="${ROOT}/${TARGET}"
fi

python3 "${ROOT}/.claude/check-null.py" "$TARGET"
