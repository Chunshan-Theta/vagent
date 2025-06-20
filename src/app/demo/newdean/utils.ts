
/**
 * 判斷當前這組帳號是否需要檢查 quota
 * @param group 
 * @param key 
 * @returns 
 */
export function requireQuota(group: string, key: string) {
  if(key === 'EM:vecrag'){
    return false
  }
  return true
}