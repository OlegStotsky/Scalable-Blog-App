const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");
const Maybe = require("folktale/maybe");

const redisUrl = "redis://localhost:6379";
const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget);
client.hset = util.promisify(client.hset);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = async function(options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || "");
  return this;
};

mongoose.Query.prototype.exec = async function() {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  const cacheKey = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    })
  );
  const cacheValue = await client.hget(this.hashKey, cacheKey);
  const maybeCacheValue = cacheValue ? Maybe.Just(cacheValue) : Maybe.Nothing();
  return maybeCacheValue.matchWith({
    Just: ({ value }) => {
      const doc = JSON.parse(value);
      return Array.isArray(doc)
        ? doc.map(x => new this.model(x))
        : new this.model(doc);
    },
    Nothing: async () => {
      const queryResult = await exec.apply(this, arguments);
      await client.hset(
        this.hashKey,
        cacheKey,
        JSON.stringify(queryResult),
        "EX",
        10
      );
      return queryResult;
    }
  });
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
};
