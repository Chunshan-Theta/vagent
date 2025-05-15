import { injectTransferTools } from "../utils";
import ragflowStaff from "./ragflowAgentStaff";
import ragflowAgentInsurancePolicyCustomer from "./ragflowAgentInsurancePolicyCustomer";
import ragflowAgentInsurancePolicySale from "./ragflowAgentInsurancePolicySale";

const agents = injectTransferTools([ragflowStaff,ragflowAgentInsurancePolicyCustomer,ragflowAgentInsurancePolicySale]);

export default agents;
