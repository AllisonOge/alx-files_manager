import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient()
      .on('error', err => console.log(`Redis client not connected to the server: ${err}`))
      .on('connect', () => console.log('Redis client connected to the server'));

    // Promisify the Redis client methods
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    try {
      return await this.getAsync(key);
    } catch (err) {
      console.error(`Error getting key: ${err}`);
    }
  }

  async set(key, value, duration) {
    try {
      await this.setAsync(key, value, 'EX', duration);
    } catch (err) {
      console.error(`Error setting key: ${err}`);
    }
  }

  async del(key) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.error(`Error deleting key: ${err}`);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
