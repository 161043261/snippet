import autocannon from "autocannon";
import { buildApp } from "../src/app";

async function run() {
  try {
    const app = await buildApp();
    await app.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server started for benchmarking on port 3000");

    const instance = autocannon(
      {
        url: "http://localhost:3000/prompts",
        headers: {
          authorization: `Basic ${Buffer.from("admin:admin").toString("base64")}`,
        },
        connections: 10,
        pipelining: 1,
        duration: 10,
      },
      (err, result) => {
        if (err) {
          console.error("Benchmark failed:", err);
        } else {
          console.log("Benchmark results:");
          console.log(`Requests/sec: ${result.requests.average}`);
          console.log(`Latency (ms): ${result.latency.average}`);
          console.log(`Throughput (bytes/sec): ${result.throughput.average}`);
          console.log(`Total Requests: ${result.requests.total}`);
        }
        app.close();
        process.exit(0);
      },
    );

    autocannon.track(instance, { renderProgressBar: true });
  } catch (err) {
    console.error(
      "Failed to start server for benchmark. Ensure MongoDB is running at mongodb://localhost:27017/db0",
      err,
    );
    process.exit(1);
  }
}

run();
