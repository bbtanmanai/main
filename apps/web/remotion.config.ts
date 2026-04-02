import { Config } from '@remotion/cli/config';

Config.setEntryPoint('./src/remotion/index.ts');

// 출력 코덱: H.264 MP4
Config.setCodec('h264');

// 동시 렌더링 스레드 수 (CPU 코어 수에 맞게 자동 설정)
Config.setConcurrency(null);

// 출력 디렉토리
Config.setOutputLocation('out/');

// 크로미움 옵션: 로컬 이미지/오디오 접근 허용
Config.setChromiumOpenGlRenderer('angle');
