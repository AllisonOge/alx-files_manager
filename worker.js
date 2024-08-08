import Queue from 'bull';
import imageThumb from 'image-thumbnail';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import dbClient from './utils/db';


// name the Queue `fileQueue`
const fileQueue = Queue('fileQueue');


fileQueue.process(async (job, done) {
  // retrive data from job.data
  const { fileId, userId } = job.data;

  // call done when finished or give an error if error or pass a result
  if (!fileId) done(new Error('Missing fileId'));
  if (!userId) done(new Error('Missing userId'));

  // read db for file
  const file = await dbClient.db.collection('files').findOne({ '_id': ObjectId(fileId), userId });
  if (!file) done(new Error('File not found'));

  // generate thumbnails
  const localPath = file.localPath;
  const localPath500 = `${localPath}_500`;
  const localPath250 = `${localPath}_250`;
  const localPath100 = `${localPath}_100`;

  fs.writeSync(localPath500, await imageThumb(localPath, { width: 500 }));
  fs.writeSync(localPath250, await imageThumb(localPath, { widht: 250 }));
  fs.writeSync(localPath100, await imagThumb(localPath, { width: 100 }));
  done();
});

export { fileQueue };
