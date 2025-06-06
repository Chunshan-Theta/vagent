"use client";
// MediaRecorder Polyfill for browsers (like iOS Safari) that do not support MediaRecorder
// Usage: new MediaRecorderPolyfill(stream)

export type MediaRecorderPolyfillOptions = {
  mimeType?: string;
};

export class MediaRecorderPolyfill {
  public stream: MediaStream;
  public state: 'inactive' | 'recording' | 'stopped' = 'inactive';
  public ondataavailable: ((e: BlobEvent) => void) | null = null;
  public onstop: (() => void) | null = null;

  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private buffer: Float32Array[] = [];
  private sampleRate: number = 44100;

  constructor(stream: MediaStream, options?: MediaRecorderPolyfillOptions) {
    this.stream = stream;
  }

  start() {
    if(typeof window === 'undefined')return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.sampleRate = this.audioContext.sampleRate;
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.buffer = [];
    this.state = 'recording';

    this.processor.onaudioprocess = (e) => {
      if (this.state !== 'recording') return;
      const input = e.inputBuffer.getChannelData(0);
      this.buffer.push(new Float32Array(input));
    };
    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  stop() {
    if(typeof window === 'undefined')return;
    this.state = 'stopped';
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
    }
    if (this.source) this.source.disconnect();
    if (this.audioContext) this.audioContext.close();

    // Encode to WAV
    const wavBlob = encodeWAV(this.buffer, this.sampleRate);
    if (this.ondataavailable) {
      this.ondataavailable(new BlobEvent('dataavailable', { data: wavBlob }));
    }
    if (this.onstop) this.onstop();
  }
}

function encodeWAV(buffers: Float32Array[], sampleRate: number): Blob {
  // Flatten
  const length = buffers.reduce((acc, cur) => acc + cur.length, 0);
  const pcm = new Float32Array(length);
  let offset = 0;
  for (const buf of buffers) {
    pcm.set(buf, offset);
    offset += buf.length;
  }
  // Convert to 16-bit PCM
  const pcm16 = new Int16Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  // WAV header
  const wavBuffer = new ArrayBuffer(44 + pcm16.length * 2);
  const view = new DataView(wavBuffer);
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcm16.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, 1, true); // NumChannels
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(view, 36, 'data');
  view.setUint32(40, pcm16.length * 2, true);
  // PCM samples
  let idx = 44;
  for (let i = 0; i < pcm16.length; i++, idx += 2) {
    view.setInt16(idx, pcm16[i], true);
  }
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Polyfill BlobEvent for iOS
class BlobEvent extends Event {
  data: Blob;
  constructor(type: string, eventInitDict: { data: Blob }) {
    super(type);
    this.data = eventInitDict.data;
  }
}

export default MediaRecorderPolyfill;