# LinkDropV2 → F:\LinkDropV2(backup) 야간 백업 스크립트
# 기준: git ls-files (추적 파일만) — 파일명·파일크기 비교
# 명시적 제외: docs / tmp / node_modules / .wrangler / .gstack / denoland.vscode-deno

$source  = "C:\LinkDropV2"
$dest    = "F:\LinkDropV2(backup)"
$logFile = "F:\LinkDropV2(backup)\_backup.log"

# 제외 패턴 (git-tracked 여부와 무관하게 강제 제외)
$excludePatterns = @(
    "^docs/",
    "^tmp/",
    "^node_modules/",
    "^\.wrangler/",
    "^\.gstack/",
    "^denoland\.vscode-deno/",
    "/node_modules/"
)

function Write-Log {
    param([string]$msg)
    $line = "$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))  $msg"
    $line | Add-Content -Path $logFile -Encoding UTF8
}

# F: 드라이브 가용 여부 확인
if (-not (Test-Path "F:\")) {
    Write-Log "[ERROR] F: 드라이브 없음 — 백업 중단"
    exit 1
}

# 백업 루트 생성
if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
}

Write-Log "===== 백업 시작 ====="

# Git 추적 파일 목록
$gitFiles = & git -C $source ls-files 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Log "[ERROR] git ls-files 실패: $gitFiles"
    exit 1
}

$copied  = 0
$skipped = 0
$excluded = 0

foreach ($rel in $gitFiles) {
    # 허용 폴더: .claude/, apps/ 또는 루트 파일만
    $topLevel = ($rel -replace '/', '\') -split '\\' | Select-Object -First 1
    if ($topLevel -ne ".claude" -and $topLevel -ne "apps" -and $rel -notmatch '^[^/]+$') {
        $excluded++
        continue
    }

    $srcPath = Join-Path $source $rel
    $dstPath = Join-Path $dest   $rel

    if (-not (Test-Path $srcPath)) { continue }

    $srcInfo = Get-Item $srcPath
    $needsCopy = $false
    $reason    = ""

    if (-not (Test-Path $dstPath)) {
        $needsCopy = $true
        $reason    = "NEW"
    } else {
        $dstInfo = Get-Item $dstPath
        if ($srcInfo.Length -ne $dstInfo.Length) {
            $needsCopy = $true
            $reason    = "SIZE $($dstInfo.Length)→$($srcInfo.Length)"
        }
    }

    if ($needsCopy) {
        $dstDir = Split-Path $dstPath -Parent
        if (-not (Test-Path $dstDir)) {
            New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
        }
        Copy-Item $srcPath $dstPath -Force
        Write-Log "[$reason] $rel"
        $copied++
    } else {
        $skipped++
    }
}

Write-Log "완료 — 복사: $copied / 변경없음: $skipped / 제외: $excluded"
Write-Log ""
