// Remotion 번들 엔트리포인트
// remotion.config.ts의 entryPoint가 이 파일을 가리킴
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
