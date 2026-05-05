#!/usr/bin/env python3
"""
check-null.py — Edit 도구 사용 후 null bytes 검사 및 자동 정리
사용법: python3 scripts/check-null.py <파일경로>
"""
import sys, os

def check_and_clean(path):
    if not os.path.exists(path):
        print(f"[ERROR] 파일 없음: {path}")
        sys.exit(1)

    with open(path, "rb") as f:
        raw = f.read()

    null_count = raw.count(b"\x00")

    if null_count == 0:
        lines = raw.decode("utf-8", errors="ignore").count("\n")
        print(f"[OK] null bytes 없음 — {lines}라인 ({len(raw):,} bytes)")
        return

    # null bytes 발견 → 자동 정리
    cleaned = raw.replace(b"\x00", b"")
    with open(path, "wb") as f:
        f.write(cleaned)

    lines = cleaned.decode("utf-8", errors="ignore").count("\n")
    print(f"[FIX] null bytes {null_count}개 제거 완료 — {lines}라인")

    # 파일 끝 정상 종료 확인
    tail = cleaned.decode("utf-8", errors="ignore").rstrip()
    if not tail.endswith("}"):
        print(f"[WARN] 파일 끝이 비정상: {repr(tail[-40:])}")
    else:
        print("[OK] 파일 종료 정상 확인")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python3 check-null.py <파일경로>")
        sys.exit(1)
    check_and_clean(sys.argv[1])
