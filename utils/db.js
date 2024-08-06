import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    const dbName = process.env.DB_DATABASE || 'file_manager';
    const url = `mongodb://${host}:${port}/${dbName}`;
    MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
      if (err) {
        this.db = false;
        console.log(`MongoDB client not connected to server: ${err}`);
      } else {
        this.db = client.db(dbName);
      }
    });
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
