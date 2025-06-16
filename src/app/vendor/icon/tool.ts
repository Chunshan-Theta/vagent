import { allIconMap } from "./all-icon";

export function iconExists(name: string): boolean {
  return name in allIconMap;
}