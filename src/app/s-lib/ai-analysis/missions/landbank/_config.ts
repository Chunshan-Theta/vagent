import type { ModelOptions } from "../../types"

export function moduleOptions() : ModelOptions{
  return {
    model: 'gpt-4o',
    top_p: 0.7,
    temperature: 0.2,
    max_tokens: 2000,
  }
}

export default moduleOptions