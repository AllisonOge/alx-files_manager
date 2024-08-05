import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    const dbName = process.env.DB_DATABASE || 'file_manager';
    const url = `mongodb://${host}:${port}/${dbName}`;
    const client = MongoClient(url, { useUnifiedTopology: true });
    this.db = false;
    client.connect()
      .then(() => {
        this.db = client.db(dbName);
      })
      .catch(err => console.log);
  }

  isAlive() {
    return !!this.db;
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
