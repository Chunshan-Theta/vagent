import * as orm from '../orm'

const M = orm.models

export function createKeyQuota(group:string, key:string, quota:number) {
  return M.KeyQuota.query().insert({
    group: group,
    key: key,
    usage: '0',
    quota: quota.toString(),
    createdAt: orm.fn.now(),
    updatedAt: orm.fn.now(),
  });
}

export async function getKeyQuota(group:string, key:string) {
  const data = await M.KeyQuota.query().where('group', group).where('key', key).first();
  if (!data) {
    return null;
  }
  const nData = {
    ...data,
    usage: parseInt(data.usage, 10),
    quota: parseInt(data.quota, 10),
  }
  return nData
}

export function checkKeyQuota(group:string, key:string) {
  return M.KeyQuota.query().findOne({ group, key }).then(quota => {
    if (!quota) {
      return {
        exists: false,
        avaiable: false,
      }
    }

    const usage = parseInt(quota.usage, 10);
    const quotaValue = parseInt(quota.quota, 10);
    
    return {
      // 是否存在
      exists: true,
      avaiable: quotaValue > usage,
    }
  });
}

export function updateKeyQuota(group:string, key:string, patch: Partial<typeof M.KeyQuota>) {
  return M.KeyQuota.query().findOne({ group, key }).patchAndFetch({
    ...patch,
    updatedAt: orm.fn.now(),
  });
}

export function increaseKeyQuotaUsage(group:string, key:string, usage:number) {
  if(usage <= 0) {
    throw new Error('Usage must be greater than 0');
  }
  return orm.getKnex().transaction(async trx => {
    const quota = await M.KeyQuota.query(trx).findOne({ group, key });
    if (!quota) {
      throw new Error('KeyQuota not found');
    }

    const usage = parseInt(quota.usage, 10);
    const quotaValue = parseInt(quota.quota, 10);

    if (usage < quotaValue) {
      return quota.$query(trx).patchAndFetch({
        usage: orm.fn.raw('usage + ?', usage),
        updatedAt: orm.fn.now(),
      });
    }
    return quota;
  });
}
