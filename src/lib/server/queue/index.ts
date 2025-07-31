import { REDIS_URL } from '$env/static/private';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const QUEUE_NAME = 'perfumes';

export const queue = new Queue(QUEUE_NAME, {
  connection: new IORedis(REDIS_URL)
});
