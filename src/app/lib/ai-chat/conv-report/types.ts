import type { Conv } from '@/app/lib/ai-chat/convApi';


export type runAnalysisOptions = {
  stopSignal?: () => boolean
  onEvent?: {
    (event: 'progress', data: { progress: number }): void
  }
}


export type AnalysisContext = {
  conv?: Conv;
  convId: string;
  analysisName: string;
  /** progress 0 ~ 100 */
  updateProgress: (progress: number) => void;
  stopSignal: () => boolean

  /** 分析中額外生成的資料 */
  datas: {
    [x: string]: any;
  }

}