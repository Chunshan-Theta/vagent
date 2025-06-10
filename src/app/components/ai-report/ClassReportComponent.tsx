import { useRef, useState, useEffect, useMemo } from 'react';
import ReportView from '@/app/components/ai-report/ReportViewV1';
import { ReportV1 } from '@/app/types/ai-report';
import LoadingIcon from '@/app/components/LoadingIcon';

const settingsMap = {
  default: {
    naturalColor: '#fff',
    angryColor: '#EF8354',
    frustratedColor: '#FFD166',
    openColor: '#06D6A0',
  }
};

export default function ClassReportComponent() {
  const reportData = useRef<ReportV1.ReportDatas | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const loading = useMemo(() => localLoading, [localLoading]);

  useEffect(() => {
    changeRootCssVar('--background', '#173944');
  });

  function changeRootCssVar(key: string, value: string) {
    const root = document.documentElement;
    root.style.setProperty(key, value);
  }

  async function fetchReportData(): Promise<ReportV1.ReportDatas> {
    const settings = settingsMap.default;
    const reportDataStr = localStorage.getItem('report');
    if (!reportDataStr) {
      throw new Error('No report data found in local storage');
    }
    const reportData = JSON.parse(reportDataStr) as ReportV1.ReportDatas;
    const { timeline } = reportData;

    const timelineDatas: ReportV1.TimelineData[] = timeline;
    return {
      timeline: timelineDatas
    };
  }

  async function init() {
    const data = await fetchReportData();
    reportData.current = data;
    console.log('[report_page]', {
      report: reportData.current
    });
  }

  useEffect(() => {
    setLocalLoading(true);
    init()
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        setLocalLoading(false);
      });
  }, []);

  function createReportView() {
    if (reportData.current) {
      return (
        <div className="max-w-4xl w-full">
          <ReportView data={reportData.current} />
        </div>
      );
    }
    return null;
  }

  return (
    <div className="ai-report-page flex flex-col items-center min-h-screen">
      <div className="flex justify-center items-center flex-1 w-full">
        {loading && <LoadingIcon />}
        {reportData.current && createReportView()}
      </div>
    </div>
  );
} 