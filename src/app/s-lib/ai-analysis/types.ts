
export type ModelOptions = {
  /** 'openai' or ...,  default = 'openai */
  platform?: string
  model?: string
  temperature?: number
  top_p?: number
  max_tokens?: number
}

export type FullMissionParamsDefine = {
  type: 'text' | 'textarea' | 'number' | 'boolean'
  name: string
  title?: string
  description?: string
  placeholder?: string
  default?: any
  options?: Array<{ label: string; value: any }>
}

export type MissionParamsDefine = Omit<FullMissionParamsDefine, 'name'>

export type MissionParamsDefineMap = { [key: string]: MissionParamsDefine }

type MaybePromise<T> = Promise<T> | T

export type MissionModule = {
  defineParams?: () => MissionParamsDefineMap
  modelOptions?: () => MaybePromise<ModelOptions>
  /** 生成的 prompt */
  getMessages: (params: any) => MaybePromise<any[]>
  /** 預期要收到的 schema */
  expectSchema?: (params: any) => MaybePromise<MissionResponseSchame>
}

export type AskRequest = {
  /** 對應分析任務的 id */
  missionId: string
  /** 若有指定，則會覆寫任務的預設參數 */
  modelOptions?: ModelOptions

  /**
   * 任務內部的參數
   */
  params?: any

  responseType?: 'json_schema' | 'json_object' | 'text'
}

export type MissionResponseSchame = {
  name?: string
  schema: any
  strict?: boolean
}

export type AIMission = { id: string, paramsDefine: MissionParamsDefineMap }