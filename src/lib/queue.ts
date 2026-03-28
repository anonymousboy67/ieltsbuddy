import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Create a persistent connection
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const evaluationQueue = new Queue("evaluation-queue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export { connection as redisConnection };
