# scratch

## Kafka

```bash
sudo apt install librdkafka-dev libssl-dev pkg-config
```

```bash
cd /path/to/kafka

KAFKA_CLUSTER_ID="$(bin/kafka-storage.sh random-uuid)"

bin/kafka-storage.sh format --standalone -t $KAFKA_CLUSTER_ID -c config/server.properties

bin/kafka-server-start.sh config/server.properties

bin/kafka-topics.sh --create --topic demo-events --bootstrap-server localhost:9092
```
