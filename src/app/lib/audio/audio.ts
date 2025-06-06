import * as wav from './wav';

export async function cutAudioBlob(audio: Blob, start: number, end: number): Promise<Blob> {
  // 將 Blob 轉為 ArrayBuffer
  const arrayBuffer = await audio.arrayBuffer();
  // 使用 AudioContext 解碼
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));

  // 計算裁剪的起始與結束 frame
  const sampleRate = audioBuffer.sampleRate;
  const startFrame = Math.floor(start * sampleRate);
  const endFrame = Math.floor(end * sampleRate);
  const frameCount = endFrame - startFrame;

  // 建立新的 AudioBuffer
  const numberOfChannels = audioBuffer.numberOfChannels;
  const newBuffer = audioContext.createBuffer(numberOfChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const oldData = audioBuffer.getChannelData(channel);
    const newData = newBuffer.getChannelData(channel);
    newData.set(oldData.subarray(startFrame, endFrame));
  }

  // 將 AudioBuffer 轉回 Blob（WAV 格式）
  function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    // RIFF chunk descriptor
    function writeString(view: DataView, offset: number, str: string) {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    }
    let offset = 0;
    writeString(view, offset, 'RIFF'); offset += 4;
    view.setUint32(offset, length - 8, true); offset += 4;
    writeString(view, offset, 'WAVE'); offset += 4;
    writeString(view, offset, 'fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, numOfChan, true); offset += 2;
    view.setUint32(offset, buffer.sampleRate, true); offset += 4;
    view.setUint32(offset, buffer.sampleRate * numOfChan * 2, true); offset += 4;
    view.setUint16(offset, numOfChan * 2, true); offset += 2;
    view.setUint16(offset, 16, true); offset += 2;
    writeString(view, offset, 'data'); offset += 4;
    view.setUint32(offset, length - offset - 4, true); offset += 4;
    // PCM samples
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        let sample = buffer.getChannelData(channel)[i];
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    return bufferArray;
  }

  const wavArrayBuffer = audioBufferToWav(newBuffer);
  return new Blob([wavArrayBuffer], { type: 'audio/wav' });
}

