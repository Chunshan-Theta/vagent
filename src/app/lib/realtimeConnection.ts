import { RefObject } from "react";

export async function createRealtimeConnection(
  EPHEMERAL_KEY: string,
  audioElement: RefObject<HTMLAudioElement | null>
): Promise<{ pc: RTCPeerConnection; dc: RTCDataChannel }> {
  const pc = new RTCPeerConnection();

  pc.ontrack = (e) => {
    if (audioElement.current) {
      const stream = e.streams[0];
      audioElement.current.srcObject = stream;
      
    }
  };

  const ms = await getUserMedia({ audio: true });
  pc.addTrack(ms.getTracks()[0]);

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

  return { pc, dc };
} 


function getUserMedia(constraints: MediaStreamConstraints) {
  // 根據不同的瀏覽器使用不同的 
  const nav = navigator as any;
  const fnPromise = navigator.mediaDevices?.getUserMedia
  const fnCallback = nav.getUserMedia || nav.webkitGetUserMedia
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