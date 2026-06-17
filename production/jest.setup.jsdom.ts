// jsdom 환경 전용 setup — MSW 서버를 띄우지 않는다.
// (브라우저 의존 로직: localStorage 등 단위 테스트용)
import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextEncoder, TextDecoder });
