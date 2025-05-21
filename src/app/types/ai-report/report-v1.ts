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
