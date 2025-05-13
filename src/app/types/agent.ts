import { z } from 'zod';

export const toolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  tool_id: z.string()
});

export const agentSchema = z.object({
  id: z.number(),
  name: z.string(),
  public_description: z.string(),
  prompt_name: z.string(),
  prompt_personas: z.string(),
  prompt_customers: z.string(),
  prompt_tool_logics: z.string(),
  prompt_voice_styles: z.string().optional(),
  prompt_conversation_modes: z.string().optional(),
  prompt_prohibited_phrases: z.string().optional(),
  tools: z.array(toolSchema).optional(),
});

export type Agent = z.infer<typeof agentSchema>;
export type Tool = z.infer<typeof toolSchema>; 