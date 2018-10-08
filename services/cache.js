const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");
const Maybe = require("folktale/maybe");

const redisUrl = "redis://localhost:6379";
const client = redis.createClient(redisUrl);
client.get = util.promisify(client.get);
client.set = util.promisify(client.set);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = async function() {
    this.useCache = true;
    return this;
}

mongoose.Query.prototype.exec = async function() {
  if (!this.useCache) {
      return exec.apply(this, arguments);
  }

  const cacheKey = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    })
  );
  const cacheValue = await client.get(cacheKey);
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
          await client.set(cacheKey, JSON.stringify(queryResult));
          return queryResult;
        }
      });
};
