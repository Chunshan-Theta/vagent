
export async function ensureKeyQuota({ group, key, quota }: { group: string; key: string; quota: number }) {
  // 確保對應的 key quota 存在
  const keyQuota = await getKeyQuota({ group, key }).catch(()=>null);
  if(!keyQuota) {
    // 如果不存在，則創建
    await createKeyQuota({ group, key, quota });
  }
}


export async function createKeyQuota({ group, key, quota }: { group: string; key: string; quota: number }) {
  const res = await fetch(`/api/key_quota?group=${encodeURIComponent(group)}&key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quota }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * 針對對應的 key quota 增加使用量
 * @param param0 
 * @returns 
 */
export async function increaseKeyQuota({ group, key, usage }: { group: string; key: string; usage: number }) {
  const res = await fetch(`/api/key_quota/use?group=${encodeURIComponent(group)}&key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usage }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * 獲取對應的 key quota
 */
export async function getKeyQuota({ group, key }: { group: string; key: string }) {
  const res = await fetch(`/api/key_quota?group=${encodeURIComponent(group)}&key=${encodeURIComponent(key)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * 更新對應的 key quota
 * 
 * TODO: 注意，這個可以複寫 usage 和 quota，後續要加入限制
 */
export async function patchKeyQuota({ group, key, patch }: { group: string; key: string; patch: any }) {
  const res = await fetch(`/api/key_quota?group=${encodeURIComponent(group)}&key=${encodeURIComponent(key)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patch }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}


