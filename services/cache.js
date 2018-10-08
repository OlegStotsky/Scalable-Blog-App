const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");
const Maybe = require('folktale/maybe');

const redisUrl = "redis://localhost:6379";
const client = redis.createClient(redisUrl);
client.get = util.promisify(client.get);
client.set = util.promisify(client.set);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = async function() {
  const cacheKey = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    })
  );
  const cacheValue = await client.get(cacheKey);
  return cacheValue ? Maybe.Just(cacheValue) : Maybe.Nothing()
       .matchWith({
           Just: ({ value }) => JSON.parse(value),
           Nothing: async () => {
              const queryResult = await exec.apply(this, arguments);
              await client.set(cacheKey, JSON.stringify(queryResult));
              return queryResult;
           }
       });
};
