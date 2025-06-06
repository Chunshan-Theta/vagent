import { RefObject } from "react";
import { pendingValue } from "./utils";


type RealtimeConnection = {
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
  getLS: () => MediaStream; // 獲取本地音訊 stream
  getRS: () => Promise<MediaStream>; // 獲取遠端音訊 stream
  getInfo: () => { sampleRate: number, channels: number }; // 獲取音訊資訊
}

export async function createRealtimeConnection(
  EPHEMERAL_KEY: string,
  audioElement: RefObject<HTMLAudioElement | null>
): Promise<RealtimeConnection> {
  const pc = new RTCPeerConnection();

  // Promise 方式取得 remote stream
  const remoteStreamPending = pendingValue<MediaStream>();

  pc.ontrack = (e) => {
    if (audioElement.current) {
      const stream = e.streams[0];
      audioElement.current.srcObject = stream;
      console.log('on track', stream);
    }
    // 回傳 remote stream
    remoteStreamPending.setValue(e.streams[0]);
  };

  const ms = await getUserMedia({ audio: true });
  pc.addTrack(ms.getTracks()[0]);
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(ms);
  const sampleRate = audioContext.sampleRate;
  const channels = source.channelCount;
  

  const dc = pc.createDataChannel("oai-events");

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const baseUrl = "https://api.openai.com/v1/realtime";
  const model = "gpt-4o-realtime-preview";

  const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
    method: "POST",
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${EPHEMERAL_KEY}`,
      "Content-Type": "application/sdp",
    },
  });

  const answerSdp = await sdpResponse.text();
  const answer: RTCSessionDescriptionInit = {
    type: "answer",
    sdp: answerSdp,
  };

  await pc.setRemoteDescription(answer);

  const getInfo = () => {
    return { sampleRate, channels };
  };
  // 回傳 localStream 及 remoteStreamPromise，方便外部錄音
  return { pc, dc, getLS: ()=>ms, getRS: ()=>remoteStreamPending.getValue(), getInfo };
} 


function getUserMedia(constraints: MediaStreamConstraints) : Promise<MediaStream>{
  // 根據不同的瀏覽器使用不同的 
  const nav = navigator as any;

  let fnPromise:typeof navigator.mediaDevices.getUserMedia|null = null;
  if(navigator.mediaDevices?.getUserMedia){
    fnPromise = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
  }
  let fnCallback:any = null;
  if(nav.getUserMedia){
    fnCallback = nav.getUserMedia.bind(nav);
  }else if(nav.webkitGetUserMedia){
    fnCallback = nav.webkitGetUserMedia.bind(nav);
  }
  if (fnPromise) {
    return fnPromise(constraints);
  }
  if (fnCallback) {
    return new Promise<MediaStream>((resolve, reject) => {
      fnCallback(constraints, resolve, reject);
    });
  }
  return Promise.reject(new Error("getUserMedia not supported"));
}

