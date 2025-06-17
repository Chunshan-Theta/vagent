
type Handler = {
  /** 處理 api 收到的資料 => text */
  fromJSON?: (value: any) => string
  /** 編輯後的資料 => json */
  toJSON?: (text: string) => string
}


const handlers = []