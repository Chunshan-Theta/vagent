import Redis from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not set');
}
const redis = new Redis(process.env.REDIS_URL);

export default redis; 