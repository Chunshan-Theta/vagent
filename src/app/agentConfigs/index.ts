import { AllAgentConfigsType } from "@/app/types";
import frontDeskAuthentication from "./frontDeskAuthentication";
import customerServiceRetail from "./customerServiceRetail";
import simpleExample from "./simpleExample";
import chineseAgent from "./chineseAgent";
import landbankAgent from "./landbankAgent";
import landbankAgentEn from "./landbankAgentEn";
import ragflowAgent from "./ragflowAgent/index";
// Shared configurations
export const sharedConfig = {
  sttPrompt: "以下語音的說話者是台灣人，請將語音轉換為文字。",
  startAsk: "接著繼續",
  language: "zh"
};

export const sharedConfigEN = {
  sttPrompt: "The speaker of the following audio is a native English speaker. Please convert the audio to text.",
  startAsk: "Continue",
  language: "en"
};

export const allAgentSets: AllAgentConfigsType = {
  frontDeskAuthentication,
  customerServiceRetail,
  simpleExample,
  chineseAgent,
  landbankAgent,
  landbankAgentEn,
  ragflowAgent
};

export const defaultAgentSetKey = "simpleExample";
