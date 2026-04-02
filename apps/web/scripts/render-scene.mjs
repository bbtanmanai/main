/**
 * render-scene.mjs
 * Remotion renderMedia() 기반 단일 씬 MP4 렌더러
 *
 * 사용법:
 *   node render-scene.mjs --props <json파일> --output <mp4경로> [--composition AccentScene-16x9]
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── 인자 파싱 ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] : null;
};

const propsFile     = getArg('props');
const outputFile    = getArg('output');
const compositionId = getArg('composition') ?? 'AccentScene-16x9';

if (!propsFile || !outputFile) {
  console.error('Usage: node render-scene.mjs --props <json> --output <mp4> [--composition <id>]');
  process.exit(1);
}

const inputProps = JSON.parse(fs.readFileSync(propsFile, 'utf-8'));
const fps = 30;
// tts_duration 기반 동적 프레임 수 (1초 여유 추가)
const durationInFrames = Math.max(30, Math.ceil((inputProps.tts_duration ?? 5) * fps) + fps);

// ── 번들 캐시 ─────────────────────────────────────────────────────────────
const BUNDLE_CACHE_DIR  = path.join(__dirname, '..', '.remotion-bundle-cache');
const BUNDLE_CACHE_FILE = path.join(BUNDLE_CACHE_DIR, 'bundle-path.txt');
const ENTRY_POINT = path.join(__dirname, '..', 'src', 'remotion', 'index.ts');

async function getBundleLocation() {
  if (fs.existsSync(BUNDLE_CACHE_FILE)) {
    const cached = fs.readFileSync(BUNDLE_CACHE_FILE, 'utf-8').trim();
    if (cached && fs.existsSync(cached)) {
      return cached;
    }
  }
  console.log('[render-scene] 번들링 시작 (최초 1회)...');
  const bundleLocation = await bundle({
    entryPoint: ENTRY_POINT,
    webpackOverride: (config) => config,
  });
  fs.mkdirSync(BUNDLE_CACHE_DIR, { recursive: true });
  fs.writeFileSync(BUNDLE_CACHE_FILE, bundleLocation, 'utf-8');
  console.log('[render-scene] 번들 캐시 저장:', bundleLocation);
  return bundleLocation;
}

// ── 렌더 실행 ─────────────────────────────────────────────────────────────
const bundleLocation = await getBundleLocation();

const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: compositionId,
  inputProps,
});

await renderMedia({
  composition: { ...composition, durationInFrames, fps },
  serveUrl: bundleLocation,
  codec: 'h264',
  outputLocation: outputFile,
  inputProps,
  chromiumOptions: {
    gl: 'angle',
    ignoreCertificateErrors: true,
  },
  onProgress: ({ progress }) => {
    process.stdout.write(`\r[render-scene] 렌더 진행: ${Math.round(progress * 100)}%`);
  },
});

console.log('\n[render-scene] 완료:', outputFile);
