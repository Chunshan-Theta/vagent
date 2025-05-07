import { injectTransferTools } from "../utils";
import ragflowStaff from "./ragflowAgentStaff";

const agents = injectTransferTools([ragflowStaff]);

export default agents;
