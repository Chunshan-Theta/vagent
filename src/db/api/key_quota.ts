import * as orm from '../orm'

const M = orm.models

export function createKeyQuota(group:string, key:string, quota:number) {
  return M.KeyQuota.query().insert({
    group: group,
    key: key,
    usage: 0,
    quota: quota,
    createdAt: orm.fn.now(),
    updatedAt: orm.fn.now(),
  });
}

export function getKeyQuota(group:string, key:string) {
  return M.KeyQuota.query().where('group', group).where('key', key).first();
}

export function checkKeyQuota(group:string, key:string) {
  return M.KeyQuota.query().findOne({ group, key }).then(quota => {
    if (!quota) {
      return {
        exists: false,
        avaiable: false,
      }
    }
    
    return {
      // 是否存在
      exists: true,
      avaiable: quota.usage >= quota.quota,
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
    if (quota.usage < quota.quota) {
      return quota.$query(trx).patchAndFetch({
        usage: orm.fn.raw('usage + ?', usage),
        updatedAt: orm.fn.now(),
      });
    }
    return quota;
  });
}