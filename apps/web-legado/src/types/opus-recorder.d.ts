// `opus-recorder` não publica declarações de tipo. Usamos um subconjunto
// pequeno da API: construir o Recorder, start()/stop() e receber o arquivo
// Ogg/Opus codificado via `ondataavailable`.
// Ver https://github.com/chris-rudmin/opus-recorder
declare module "opus-recorder" {
  interface RecorderConfig {
    /** URL do worker de encoding (servido de /public). */
    encoderPath?: string;
    /** Constraints da trilha de áudio, ou `true` para o default. */
    mediaTrackConstraints?: MediaTrackConstraints | boolean;
    /** 1 = mono, 2 = estéreo. */
    numberOfChannels?: number;
    /** 2048 = Voz, 2049 = Full Band Audio, 2051 = Restricted Low Delay. */
    encoderApplication?: number;
    /** 8000 | 12000 | 16000 | 24000 | 48000. */
    encoderSampleRate?: number;
    /** Bitrate alvo em bits/seg. */
    encoderBitRate?: number;
    /** false (default) → ondataavailable dispara uma vez com o arquivo completo. */
    streamPages?: boolean;
  }

  export default class Recorder {
    constructor(config?: RecorderConfig);
    /** Disparado com os bytes codificados (arquivo Ogg/Opus completo quando streamPages é false). */
    ondataavailable: ((data: Uint8Array) => void) | null;
    start(): Promise<void>;
    stop(): Promise<void>;
    /** Probe de suporte do browser, exposto como static da classe. */
    static isRecordingSupported(): boolean;
  }
}
