import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AuthController {
  static _extractBase64AuthorizationHeader(req) {
    if (!req) {
      return null;
    }
    return req.header('Authorization').split(' ')[1];
  }

  static _decodeAndExtractUserCredentials(base64Auth) {
    if (!base64Auth) {
      return null;
    }
    return Buffer.from(base64Auth, 'base64').toString('ascii').split(':');
  }

  static async getConnect(req, res) {
    const base64Auth = AuthController._extractBase64AuthorizationHeader(req);
    if (!base64Auth) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    const [email, password] = AuthController._decodeAndExtractUserCredentials(base64Auth);
    if (!email || !password) {
      return res.send(401).json({ error: 'Unauthorized' });
    }

    // get user from database
    const user = await dbClient.db.collection('users').findOne({ email, password: sha1(password) });
    if (!user || user.password !== sha1(password)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 60 * 60 * 24);
    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.send(401).json({ error: 'Unauthorized' });
    }

    await redisClient.del(`auth_${token}`);
    return res.status(204).end();
  }
}
