'use client';

import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import MediaRecorderPolyfill from "@/app/lib/MediaRecorderPolyfill"; // 確保這個路徑正確
import { useEvent } from "@/app/contexts/EventContext";
import mitt from 'mitt';
import { clear } from 'console';

interface AppContextProps {
  dataChannel: RTCDataChannel | null;
  setRtcAudioElement: (audio: HTMLAudioElement | null) => void;
  setDataChannel: (dc: RTCDataChannel | null) => void;

  recorder: ReturnType<typeof useRecorderState>;

  sendClientEvent: (eventObj: any, eventNameSuffix?: string) => void;
  stopAudio: () => void;

}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dataChannel, setDataChannel] = useState<any>(null);
  const rtcAudioElement = useRef<HTMLAudioElement | null>(null);
  const rtcAudioPrevVolume = useRef<number | null>(null);

  const recorder = useRecorderState();

  const { setLocalAudioStream, setRemoteAudioStream, toggleRecorder, getAudioBlob } = recorder;

  // Use a try-catch to handle the case when EventContext is not available
  let logClientEvent;
  try {
    const eventContext = useEvent();
    logClientEvent = eventContext.logClientEvent;
  } catch (error) {
    // 出現這個狀況，代表 Provider 的順序有問題需要調整
    // 用替代方案送出的訊息只會出現在 console 中
    console.warn("EventContext not available, using default values");
    logClientEvent = (eventObj: any, eventNameSuffix = "") => {
      console.log(`[Client Event] ${eventNameSuffix}:`, eventObj);
    };
  }

  const setRtcAudioElement = (audioElement: HTMLAudioElement | null) => {
    rtcAudioElement.current = audioElement;
  }

  const enableAudio = () => {
    if (rtcAudioElement.current) {
      const volume = rtcAudioPrevVolume.current ?? 1;
      rtcAudioElement.current.volume = volume;
    }
  }

  const stopAudio = () => {
    if (rtcAudioElement.current) {
      rtcAudioPrevVolume.current = rtcAudioElement.current.volume;
      rtcAudioElement.current.volume = 0;
    }
  }

  const sendClientEvent = (eventObj: any, eventNameSuffix = "") => {
    if (dataChannel && dataChannel.readyState === "open") {
      logClientEvent(eventObj, eventNameSuffix);
      dataChannel.send(JSON.stringify(eventObj));
    } else {
      logClientEvent(
        { attemptedEvent: eventObj.type },
        "error.data_channel_not_open"
      );
      console.error(
        "Failed to send message - no data channel available",
        eventObj
      );
    }
  };

  const ctx = {
    setRtcAudioElement,
    stopAudio,
    dataChannel,
    setDataChannel,
    sendClientEvent,

    recorder
  }

  return (
    <AppContext.Provider value={ctx}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};




function useRecorderState() {
  type MRecorder = {
    start: () => void;
    stop: () => void;
    ondataavailable: ((e: BlobEvent) => any) | null;
  }
  const getRecorder = () => {
    if (typeof window === 'undefined') return null;
    if (window.MediaRecorder) {
      return window.MediaRecorder;
    } else if (MediaRecorderPolyfill) {
      return MediaRecorderPolyfill;
    } else {
      console.error("MediaRecorder is not supported in this environment.");
      return null;
    }
  }
  const chunks = useRef({
    lasType: '',
    las: [] as BlobPart[], // Local Audio Stream
    rasType: '',
    ras: [] as BlobPart[], // Remote Audio Stream
  })
  const events = useRef(mitt());
  useEffect(() => {
    events.current = mitt();
  }, [])
  const state = useRef({
    sampleRate: 44100, // 預設採樣率
    channels: 1, // 預設聲道數

    startTime: -1, // 開始錄音的時間戳 (通常是 Date.now() 毫秒)
    stopTime: -1,
    lastReceivedTime: -1, // 最後收到資料的時間戳
    waitData: {
      las: false, // 是否需要等待本地音訊資料
      ras: false, // 是否需要等待遠端音訊資料
    },

    las: null as MediaStream | null, // Local Audio Stream
    ras: null as MediaStream | null, // Remote Audio Stream

    lasRecorder: null as MRecorder | null, // Local Audio Stream Recorder
    rasRecorder: null as MRecorder | null, // Remote Audio Stream Recorder

    open: false, // 是否開啟錄音功能
  });



  const setStartTime = (time: number) => {
    state.current.startTime = time;
  };

  const setRecorderInfo = (sampleRate: number, channels: number) => {
    state.current.sampleRate = sampleRate;
    state.current.channels = channels;
  };

  const addChunk = (type: 'las' | 'ras', chunk: BlobPart) => {
    console.log('add chunk', type, chunk);
    if (type === 'las') {
      chunks.current.las.push(chunk);
      state.current.waitData.las = false;
      events.current.emit('las-chunk-added', chunk);
    } else if (type === 'ras') {
      chunks.current.ras.push(chunk);
      state.current.waitData.ras = false;
      events.current.emit('ras-chunk-added', chunk);
    }
  };
  const setLocalAudioStream = (stream: MediaStream) => {
    state.current.las = stream;
  };
  const setRemoteAudioStream = (stream: MediaStream) => {
    state.current.ras = stream;
  };
  const toggleRecorder = (open: boolean) => {
    const prevOpen = state.current.open;
    state.current.open = open;

    if (prevOpen && !open) {
      stopRecording();
    } else if (!prevOpen && open) {
      clearChunks();
      startRecording();
    }
  }

  /**
   * 直接在設定完所有主要資訊後開始錄音
   * @param las 
   * @param ras 
   * @param sampleRate 
   * @param channels 
   */
  const quickSetup = (las: MediaStream, ras: MediaStream, sampleRate: number, channels: number) => {
    toggleRecorder(false); // 先關閉錄音器，避免重複啟動
    setLocalAudioStream(las);
    setRemoteAudioStream(ras);
    setStartTime(Date.now());
    setRecorderInfo(sampleRate, channels);
    toggleRecorder(true);
  }

  function _waitForData(type: 'las' | 'ras', timeout: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      let timer = null as any;
      const eventName = type === 'las' ? 'las-chunk-added' : 'ras-chunk-added';

      const resolveFN = () => {
        clear();
        resolve();
      }
      const clear = () => {
        events.current.off(eventName, resolveFN);
        if (timer) {
          clearTimeout(timer);
        }
      }
      timer = setTimeout(() => {
        clear();
        reject(new Error(`timeout`));
      }, timeout);
      events.current.on(eventName, resolveFN);
    })
  }

  const getAudioBlob = async (type: 'las' | 'ras') => {
    const { las: waitLas, ras: waitRas } = state.current.waitData;
    const p1 = waitLas ? _waitForData('las') : Promise.resolve();
    const p2 = waitRas ? _waitForData('ras') : Promise.resolve();
    await Promise.all([p1, p2]);
    const mChunks = type === 'las' ? chunks.current.las : chunks.current.ras;
    if (mChunks.length === 0) {
      return null;
    }
    const blob = new Blob(mChunks, { type: type === 'las' ? chunks.current.lasType : chunks.current.rasType });
    return blob;
  }

  // -- local functions --

  function clearChunks() {
    chunks.current.las = [];
    chunks.current.ras = [];
  }

  function stopRecording() {
    let stop = false
    if (state.current.lasRecorder) {
      state.current.lasRecorder.stop();
      state.current.lasRecorder = null;
      stop = true;
    }
    if (state.current.rasRecorder) {
      state.current.rasRecorder.stop();
      state.current.rasRecorder = null;
      stop = true;
    }
    if (stop) {
      state.current.stopTime = Date.now();
      state.current.waitData.las = true;
      state.current.waitData.ras = true;
    }
  }

  function startRecording() {
    console.log('recorder.start')
    const Recorder = getRecorder();
    if (!Recorder) { return; }

    // 優先選擇 mp4、mpeg、wav，最後才用 webm
    let options = {};

    if (MediaRecorder.isTypeSupported('audio/mp4')) {
      options = { mimeType: 'audio/mp4' };
    } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
      options = { mimeType: 'audio/mpeg' };
    } else if (MediaRecorder.isTypeSupported('audio/wav')) {
      options = { mimeType: 'audio/wav' };
    } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      options = { mimeType: 'audio/webm;codecs=opus' };
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      options = { mimeType: 'audio/webm' };
    } else {
      // fallback，讓瀏覽器自動決定
      options = {};
    }
    if (state.current.las && !state.current.lasRecorder) {
      state.current.lasRecorder = new Recorder(state.current.las, options);
      state.current.lasRecorder.ondataavailable = (e) => {
        chunks.current.lasType = e.data.type;
        addChunk('las', e.data);
      };
      state.current.lasRecorder.start();
    }

    if (state.current.ras && !state.current.rasRecorder) {
      state.current.rasRecorder = new Recorder(state.current.ras, options);
      state.current.rasRecorder.ondataavailable = (e) => {
        chunks.current.rasType = e.data.type;
        addChunk('ras', e.data);
      };
      state.current.rasRecorder.start();
    }
  }

  return {
    state: state,
    quickSetup,
    setStartTime,
    setLocalAudioStream,
    setRemoteAudioStream,
    toggleRecorder,
    getAudioBlob,
    setRecorderInfo,
  }
}