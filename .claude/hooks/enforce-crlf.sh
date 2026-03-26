#!/bin/bash
# PostToolUse hook: Write/Edit 후 bat/cmd 파일이면 CRLF 강제 변환
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_result.filePath // empty')

if [[ "$FILE_PATH" == *.bat ]] || [[ "$FILE_PATH" == *.cmd ]]; then
  # LF → CRLF 변환 (이미 CRLF인 줄은 건드리지 않음)
  sed -i 's/\r$//' "$FILE_PATH" 2>/dev/null   # 먼저 CR 제거 (중복 방지)
  sed -i 's/$/\r/' "$FILE_PATH" 2>/dev/null   # LF → CRLF
  echo "CRLF enforced: $FILE_PATH" >&2
fi
exit 0
