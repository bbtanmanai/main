# 파일 편집 프로토콜 — null bytes 방지 규칙

> 작성일: 2026-05-02
> 원인: Edit 도구가 한글 포함 TSX/TS 파일에 null bytes(\x00) 삽입 → 린터가 파일 잘라냄

---

## 판단 기준

| 상황 | 도구 |
|------|------|
| 100줄 이상 수정 또는 전체 재작성 | Python3 직접 작성 |
| 100줄 미만 소규모 수정 | Edit 도구 → 즉시 null bytes 검사 |
| 컴포넌트 신규 생성 | Python3 또는 bash cat |

---

## 소규모 수정 후 null bytes 검사 (필수)

Edit 도구 사용 후 반드시 아래 명령어를 실행한다:

```bash
python3 /sessions/vigilant-zealous-goldberg/mnt/LinkDropV2/.claude/check-null.py <파일경로>
```

또는 단축 alias:

```bash
bash /sessions/vigilant-zealous-goldberg/mnt/LinkDropV2/.claude/check-null.sh <파일경로>
```

---

## 대용량 파일 작성 패턴

Python heredoc 방식으로 작성한다. Edit 도구 사용 금지.

```python
python3 << 'EOF'
path = '/sessions/.../파일명.tsx'
content = """
"use client";
// ... 전체 내용
"""
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"작성 완료: {content.count(chr(10))}라인")
