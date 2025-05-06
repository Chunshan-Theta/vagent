import { AllAgentConfigsType } from "@/app/types";
import frontDeskAuthentication from "./frontDeskAuthentication";
import customerServiceRetail from "./customerServiceRetail";
import simpleExample from "./simpleExample";
import chineseAgent from "./chineseAgent";
import landbankAgent from "./landbankAgent";

export const allAgentSets: AllAgentConfigsType = {
  frontDeskAuthentication,
  customerServiceRetail,
  simpleExample,
  chineseAgent,
  landbankAgent,
};

export const defaultAgentSetKey = "simpleExample";
