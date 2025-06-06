
// code from: https://stackoverflow.com/questions/62172398/convert-audiobuffer-to-arraybuffer-blob-for-wav-download

// Returns Uint8Array of WAV bytes
interface GetWavBytesOptions extends WavHeaderOptions {
  isFloat?: boolean;
}

export function getWavBytes(
  buffer: ArrayBuffer,
  options: GetWavBytesOptions
): Uint8Array {
  const type: typeof Float32Array | typeof Uint16Array = options.isFloat ? Float32Array : Uint16Array;
  const numFrames: number = buffer.byteLength / type.BYTES_PER_ELEMENT;

  const headerBytes: Uint8Array = getWavHeader(Object.assign({}, options, { numFrames }));
  const wavBytes: Uint8Array = new Uint8Array(headerBytes.length + buffer.byteLength);

  // prepend header, then add pcmBytes
  wavBytes.set(headerBytes, 0);
  wavBytes.set(new Uint8Array(buffer), headerBytes.length);

  return wavBytes;
}

// adapted from https://gist.github.com/also/900023
// returns Uint8Array of WAV header bytes
interface WavHeaderOptions {
  numFrames: number;
  numChannels?: number;
  sampleRate?: number;
  isFloat?: boolean;
}

export function getWavHeader(options: WavHeaderOptions): Uint8Array {
  const numFrames =      options.numFrames
  const numChannels =    options.numChannels || 2
  const sampleRate =     options.sampleRate || 44100
  const bytesPerSample = options.isFloat? 4 : 2
  const format =         options.isFloat? 3 : 1

  const blockAlign = numChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = numFrames * blockAlign

  const buffer = new ArrayBuffer(44)
  const dv = new DataView(buffer)

  let p = 0

  function writeString(s: string): void {
    for (let i = 0; i < s.length; i++) {
      dv.setUint8(p + i, s.charCodeAt(i))
    }
    p += s.length
  }

  function writeUint32(d: number): void {
    dv.setUint32(p, d, true)
    p += 4
  }

  function writeUint16(d: number): void {
    dv.setUint16(p, d, true)
    p += 2
  }

  writeString('RIFF')              // ChunkID
  writeUint32(dataSize + 36)       // ChunkSize
  writeString('WAVE')              // Format
  writeString('fmt ')              // Subchunk1ID
  writeUint32(16)                  // Subchunk1Size
  writeUint16(format)              // AudioFormat https://i.sstatic.net/BuSmb.png
  writeUint16(numChannels)         // NumChannels
  writeUint32(sampleRate)          // SampleRate
  writeUint32(byteRate)            // ByteRate
  writeUint16(blockAlign)          // BlockAlign
  writeUint16(bytesPerSample * 8)  // BitsPerSample
  writeString('data')              // Subchunk2ID
  writeUint32(dataSize)            // Subchunk2Size

  return new Uint8Array(buffer)
}