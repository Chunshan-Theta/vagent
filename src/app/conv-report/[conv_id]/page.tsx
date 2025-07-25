'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import * as convApi from '@/app/lib/ai-chat/convApi';
import * as reportApi from '@/app/lib/ai-chat/conv-report';
import ReportViewV2 from '@/app/components/ai-report/ReportViewV2';

export default function ConvReport() {
  // 開始時先抓 path 中的 conv_id
  const params = useParams();
  const searchParams = useSearchParams();
  const convId = params?.conv_id as string;
  const encConvId = useMemo(() => {
    return encodeURIComponent(convId || '');
  }, [convId]);
  const reportName = useMemo(() => {
    return searchParams.get('report')
  }, [searchParams]);
  const [conv, setConv] = useState<convApi.Conv | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  /** 0 ~ 100 */
  const [progress, setProgress] = useState(0);
  const [background, setBackground] = useState('#fff');

  const [report, setReport] = useState<{ status: string, data: any } | null>(null)

  const abortController = useRef<AbortController | null>(null);
  /** intervalID or null */
  const checkTimer = useRef<any>(null);

  useEffect(() => {
    setLoading(true);
    initConv().catch((error) => {
      console.error(error);
      window.alert(error.message);
    });
  }, [])

  useEffect(() => {
    changeRootCssVar('--background', background)
  }, [background])

  useEffect(() => {
    // 裡面會自動檢查狀態，只在可以開始分析時才會呼叫
    initReport().catch((error) => {
      console.error(error);
      window.alert(error.message);
    });
  }, [conv, reportName]);

  useEffect(() => {
    if (reportName === 'analysis-v1') {
      setBackground('#173944')
    }
  }, [reportName]);

  async function initConv() {
    console.log('init conv', convId)
    const mConv = await convApi.getConvById(convId)
    setConv(mConv);
  }

  async function initReport() {
    if (!conv) { return }
    console.log('init report:', convId, reportName);
    const analysis = await getAnalysisData();

    const messages = await convApi.getConvMessages(convId)
    if (messages) {
      setMessages(messages);
    }

    if (analysis) {
      setReport({
        status: analysis.status,
        data: analysis.data
      });
      setProgress(100);
      setLoading(false);
    } else {
      // 如果沒有記錄，則開始分析
      startAnalysis();
    }
  }

  function startAnalysis() {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    if (!reportName) {
      return;
    }
    setIsAnalysisRunning(true);
    console.log('start analysis:', convId, reportName);
    const abort = new AbortController();
    abortController.current = abort;
    reportApi.runAnalysis(reportName, convId, {
      stopSignal: () => abort.signal.aborted,
      onEvent: (event, data) => {
        if (event === 'progress') {
          setProgress(data.progress);
        }
      }
    })
      .then((res) => {
        if (res.status === 'cancel') {
          return;
        }
        setReport({
          status: res.status,
          data: res.data
        });
        setProgress(100);
        console.log('Analysis result:', res);
      })
      .catch((err) => {
        console.error('Error running analysis:', err);
        if (err instanceof Error) {
          window.alert(err.message);
          setErrorMsg(err.message);
        } else {
          window.alert('An unknown error occurred while running the analysis.');
          setErrorMsg('An unknown error occurred while running the analysis.');
        }
      })
      .finally(() => {
        setIsAnalysisRunning(false);
        setLoading(false);
        abortController.current = null;
      });
  }


  /** 修改 :root 內的 css var */
  function changeRootCssVar(key: string, value: string) {
    const root = document.documentElement
    root.style.setProperty(key, value)
  }

  async function getAnalysisData() {
    if (!reportName) {
      return;
    }
    const analysis = await convApi.getConvAnalysis(convId, reportName);
    return JSON.parse(analysis?.analysis || 'null') as { status: string, data: any } | null;
  }


  function renderReport() {
    if (!reportName || !report) {
      return <div></div>;
    }
    if (reportName === 'analysis-v1') {
      return (
        <div>
          <ReportViewV2
            data={report.data}
            message={messages || []}
          />
        </div>
      )
    }
    return <div>No report data available.</div>;
  }



  return (
    <>
      {(errorMsg || loading || isAnalysisRunning) && LoadingUI({ loading, progress, isAnalysisRunning, errorMsg })}
      {renderReport()}
    </>
  );
}

type LoadingUIProps = {
  loading: boolean;
  progress: number;
  isAnalysisRunning: boolean;
  errorMsg?: string | null;
};
function LoadingUI(props: LoadingUIProps) {
  const { loading, progress, isAnalysisRunning, errorMsg } = props;
  const loadingText = isAnalysisRunning ? '分析中，請稍候…' : '載入中，請稍候…';
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80 z-50">
      <div className="mb-4 text-lg font-semibold text-gray-700">{errorMsg || loadingText}</div>
      {progress > 0 &&
        (
          <>
            <div className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-600">{progress.toFixed(1)}%</div>
          </>
        )
      }
    </div>
  );
}