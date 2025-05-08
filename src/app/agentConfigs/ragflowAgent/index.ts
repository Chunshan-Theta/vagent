import { injectTransferTools } from "../utils";
import ragflowStaff from "./ragflowAgentStaff";
import ragflowAgentInsurancePolicyCustomer from "./ragflowAgentInsurancePolicyCustomer";
import ragflowAgentInsurancePolicySale from "./ragflowAgentInsurancePolicySale";

const agents = injectTransferTools([ragflowAgentInsurancePolicySale]);

export default agents;
