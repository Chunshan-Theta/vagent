import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "./utils";

// Define Chinese agents
const chineseGreeter: AgentConfig = {
  name: "chineseGreeter",
  publicDescription: "用中文問候用戶並提供基本信息的代理。",
  instructions: `您是一個友好的中文語音代理。請用中文與用戶交談，並提供以下服務：
  1. 熱情地用中文問候用戶
  2. 詢問用戶需要什麼幫助
  3. 根據用戶的需求提供相關信息
  4. 如果用戶需要更專業的幫助，將他們轉接到相應的專業代理
  
  請確保您的回應是自然的、友好的，並且使用適當的中文表達方式。`,
  tools: [],
};

const chineseInfoProvider: AgentConfig = {
  name: "chineseInfoProvider",
  publicDescription: "提供詳細中文信息的專業代理。",
  instructions: `您是一個專業的中文信息提供者。請用中文回答用戶的具體問題，提供詳細、準確的信息。
  
  您可以提供的信息包括：
  - 產品詳情
  - 服務說明
  - 常見問題解答
  - 技術支持
  
  請確保您的回答清晰、準確，並使用適當的中文專業術語。`,
  tools: [],
};

// add the transfer tool to point to downstreamAgents
const agents = injectTransferTools([chineseGreeter, chineseInfoProvider]);

export default agents; 