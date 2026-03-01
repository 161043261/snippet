import { createClient } from "redis";

async function exampleRedisClient() {
  const client = await createClient()
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();

  await client.set("key", "value");
  const value = await client.get("key");
  console.log(value);
  client.destroy();
}

export default exampleRedisClient;
