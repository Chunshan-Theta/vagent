export type TimelineData = {
  mainColor: string
  title: string
  /**如果沒給，會變成用 mainColor*/
  subtitleColor?: string
  subtitle: string
  aiRole?: string
  userRole?: string
  aiSay?: string
  userSay?: string
  analysis?: string[]
  keyPoint?: {
    sentences: string[]
    problems: string[]
  }
}

export type ReportDatas = {
  timeline: TimelineData[]
}

export type GradingItem = {
  appendScore: number
  reason: string
  score: number
  title: string
  type: string
  typeId: number
}

export type OReportProps = {
  history?: Array<{ role: string, content: string }>
  rubric?: Array<{ criterion: string, score: number, reason: string }>
  playLogText?: string
  adviceItems?: Array<{ content: string }>
  user?: {
    name?: string
    code?: string
    jobTitle?: string
  }
}