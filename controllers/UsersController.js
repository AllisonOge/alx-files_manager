import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class UsersController {
  static async postNew(req, res) {
    // request body should have email and password
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    // check if email already exists
    const emailExists = await dbClient.db.collection('users').findOne({ email });
    if (emailExists) {
      return res.status(400).json({ error: 'Already exist' });
    }

    // hash password using SHA1
    const hashedPwd = sha1(password);

    // store in database
    const reply = await dbClient.db.collection('users').insertOne({ email, password: hashedPwd });
    return res.status(201).json({ id: reply.insertedId, email });
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // find user
    const user = await dbClient.db.collection('users').findOne({ '_id': ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json({ id: userId, email: user.email });
  }
}
