const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const redisUrl = 'redis://localhost:6379';
const client = redis.createClient(redisUrl);
client.get = util.promisify(client.get);
client.set = util.promisify(client.set);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = async function() {
    const cacheKey = JSON.stringify(Object.assign({}, this.getQuery(), { collection: this.mongooseCollection.name }));
    const cacheValue = await client.get(cacheKey);
    if (cacheValue) {
        console.log(cacheValue);
        return JSON.parse(cacheValue);
    }

    const queryResult = await exec.apply(this, arguments);
    console.log(queryResult);
    await client.set(cacheKey, JSON.stringify(queryResult));
    return queryResult;
}