import Kafka from "node-rdkafka";

console.log(Kafka.features);
console.log(Kafka.librdkafkaVersion);

const EXAMPLE_TOPIC = "example-topic";

function makeProducer() {
  const producer = new Kafka.Producer({
    "client.id": "example-producer",
    "metadata.broker.list": "127.0.0.1:9092",
    "compression.codec": "gzip",
    "retry.backoff.ms": 200,
    "message.send.max.retries": 10,
    "socket.keepalive.enable": true,
    "queue.buffering.max.messages": 100000,
    "queue.buffering.max.ms": 1000,
    "batch.num.messages": 1000000,
    dr_cb: true,
  });

  // Connect to the broker manually
  producer.connect();

  // Wait for the ready event before proceeding
  producer.on("ready", () => {
    try {
      for (let i = 0; i < 10; i++) {
        producer.produce(
          // Topic to send the message to
          EXAMPLE_TOPIC,

          // optionally we can manually specify a partition for the message
          // this defaults to -1 - which will use librdkafka's default partitioner (consistent random for keyed messages, random for unkeyed messages)
          null,

          // Message to send. Must be a buffer
          Buffer.from(`Example Value ${i}`),

          // for keyed messages, we also specify the key - note that this field is optional
          `example-key-${i}`,

          // you can send a timestamp here. If your broker version supports it,
          // it will get added. Otherwise, we default to 0
          Date.now(),
        );
      }
    } catch (err) {
      console.error(err);
    }
  });

  // Any errors we encounter, including connection errors
  producer.on("event.error", (err) => {
    console.error(err);
  });

  // We must either call .poll() manually after sending messages
  // or set the producer to poll on an interval (.setPollInterval).
  // Without this, we do not get delivery events and the queue
  // will eventually fill up.
  producer.setPollInterval(100);

  producer.on("delivery-report", (err, report) => {
    // Report of delivery statistics here:
    console.log(report);
  });
}

function makeConsumer() {
  const consumer = new Kafka.KafkaConsumer(
    {
      "group.id": "example-consumer-group",
      "metadata.broker.list": "localhost:9092",
    },
    {},
  );

  // Flowing mode
  consumer.connect();
  consumer
    .on("ready", () => {
      consumer.subscribe([EXAMPLE_TOPIC]);

      // Consume from the librdtesting-01 topic. This is what determines
      // the mode we are running in. By not specifying a callback (or specifying
      // only a callback) we get messages as soon as they are available.
      consumer.consume();
    })
    .on("data", (data) => {
      // Output the actual message contents
      console.log(data.value?.toString());
    });
}

function makeAdmin() {
  const admin = Kafka.AdminClient.create({
    "client.id": "example-admin",
    "metadata.broker.list": "127.0.0.1:9092",
  });

  admin.createTopic(
    {
      topic: EXAMPLE_TOPIC,
      num_partitions: 1,
      replication_factor: 1,
    },
    (err) => {
      console.log(err);
    },
  );
}

export { makeProducer, makeConsumer, makeAdmin };
