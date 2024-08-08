import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class FilesController {
  static async authReq(req, res) {
    // retrieve the user based on the token
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = dbClient.db.collection('users').findOne({ '_id': ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return [token, userId, user];
  }

  static async postUpload(req, res) {
    // authorize request
    const [_, userId, user] = await FilesController.authReq(req, res);
    // create a file
    const { name, type, parentId=0, isPublic=false, data } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    const typeOptions = ['folder', 'file', 'image'];
    if (!type || !typeOptions.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== 0) {
      // check if file is present in DB
      const file = await dbClient.db.collection('files').findOne({ '_id': ObjectId(parentId) });
      if (!file) return res.status(400).json({ error: 'Parent not found' });
      if (file.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
     }

     const folderData = { userId: ObjectId(userId), parentId, name, type, isPublic };
     if (type === 'folder') {
       // insert file into database if parent file type is a folder
       let reply = await dbClient.db.collection('files').insertOne({
         userId, name, type, isPublic, parentId
       });
       return res.status(201).json({ id: reply.insertedId, ...folderData });
    }

    // store data
    const parentPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const fileId = uuidv4()
    const localPath = path.join(parentPath, fileId);

    await fs.promises.mkdir(parentPath, { recursive: true });
    await fs.promises.writeFile(path.join(parentPath, fileId), Buffer.from(data, 'base64'));

    let reply = await dbClient.db.collection('files').insertOne({ localPath, ...folderData });
    return res.status(201).json({ id: reply.insertedId, ...folderData });
  }

  static async getShow(req, res) {
    // authorise request
    const [_, userId, user] = await FilesController.authReq(req, res);

    // retrieve file
    const { fileId } = req.params;
    const file = dbClient.db.collection('files').findOne({ '_id': ObjectId(fileId), userId });
    if (!file) return res.status(404).json({ error: 'Not found' });
    return res.json(file);
  }


  static async getIndex(req, res) {
    // authorise request
    const [_, userId, user] = await FilesController.authReq(req, res);

    // retrive all users files
    const { parentId=0, page='0' } = req.query;
    const filesCount = await dbClient.db.collection('files').countDocuments({ userId: ObjectId(userId), parentId });
    if (filesCount === 0) return res.json([]);

    const skip = parseInt(page, 10) * 20;
    // paginate query using mongodb aggregate cursor
    const files = await dbClient.db.collection('files').aggregate([
      { $match: { userId: ObjectId(userId), parentId } },
      { $skip: skip },
      { $limit: 20 },
    ]).toArray();
    return res.json(files.map((file) => ({ ...file, id: file._id, _id: undefined })));
  }
}
