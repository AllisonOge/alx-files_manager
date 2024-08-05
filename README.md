# alx-files_manager
A project to summarize the backend specialization training with ALX. The objective is to build a simple platform to upload and view files (users authenticate via a token, users can list all files, users can upload a new file, change the permission of a file, view the file and generate thumbnails for images).


## Setup environment

- node v12.x.x
- Ubuntu 18.04

## Tasks

- `utils.redis.js` file contains the `RedisClient` which is a class that  create a client to Redis such that any error of the redis client must be displayed in the console. There is a method `isAlive` that returns true when the connection to Redis is a success otherwise false. There are some asynchronous methods `get`, `set` and `del` that returns the Redis value for a stored key, set a key value pair with an expiration duration and deletes a Redis key.

```python
# Usage
import redisClient from './utils/redis';

(async () => {
    console.log(redisClient.isAlive());
    console.log(await redisClient.get('myKey'));
    await redisClient.set('myKey', 12, 5);
    console.log(await redisClient.get('myKey'));

    setTimeout(async () => {
        console.log(await redisClient.get('myKey'));
    }, 1000*10)
})();
```
```bash
bob@dylan:~$ npm run dev main.js
true
null
12
null
```
- `utils/db.js` file contains the class `DBClient` -- a class that creates a client to MongoDB that retrieves the host, port and database from the environment variables `DB_HOST`, `DB_PORT`, and `DB_DATABASE`. The class has the method `isAlive` which does the same function as that of `RedisClient`, two asynchronous methods `nbUsers` and `nbFiles` to return the number of documents in the collection of `users` and `files` respectively.

```python
# Usage
import dbClient from './utils/db';

const waitConnection = () => {
    return new Promise((resolve, reject) => {
        let i = 0;
        const repeatFct = async () => {
            await setTimeout(() => {
                i += 1;
                if (i >= 10) {
                    reject()
                }
                else if(!dbClient.isAlive()) {
                    repeatFct()
                }
                else {
                    resolve()
                }
            }, 1000);
        };
        repeatFct();
    })
};

(async () => {
    console.log(dbClient.isAlive());
    await waitConnection();
    console.log(dbClient.isAlive());
    console.log(await dbClient.nbUsers());
    console.log(await dbClient.nbFiles());
})();
```
```bash
bob@dylan:~$ npm run dev main.js
false
true
4
30
```
- 
