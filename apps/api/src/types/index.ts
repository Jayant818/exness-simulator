export type MessageToSend = {
  type: "candles";
  data: {
    market: string;
  };
};

//    ~/Desktop/Projects/exchangeV1    main !11 ?4   sudo docker exec -it 9caf9a75ad31 /bin/bash
// [sudo] password for jayant:
// root@9caf9a75ad31:/data# redis-cli
// 127.0.0.1:6379> PUBLISH polling-channel-for-events '{"type":"SUBSCRIBE","market":"BTCUSDT"}'
// (integer) 1
// 127.0.0.1:6379> PUBLISH polling-channel-for-events '{"type":"SUBSCRIBE","market":"BTCUSDT"}'
// (integer) 1
// 127.0.0.1:6379> PUBLISH polling-channel-for-events '{"type":"SUBSCRIBE","market":"ETHUSDT"}'
// (integer) 1
// 127.0.0.1:6379> PUBLISH polling-channel-for-events '{"type":"SUBSCRIBE","market":"USDT"}'
// (integer) 1
// 127.0.0.1:6379> PUBLISH polling-channel-for-events '{"type":"SUBSCRIBE","market":"XRPUSDT"}'
// (integer) 1
// 127.0.0.1:6379> PUBLISH polling-channel-for-events '{"type":"SUBSCRIBE","market":"LTCUSDT"}'
// (integer) 1
// 127.0.0.1:6379> PUBLISH polling-channel-for-events '{"type":"SUBSCRIBE","market":"SOLUSDT"}'
// (integer) 1
// 127.0.0.1:6379> PUBLISH polling-channel-for-events '{"type":"SUBSCRIBE","market":"SOLUSDT"}'
// (integer) 1
// 127.0.0.1:6379> PUBLISH polling-channel-for-events '{"type":"SUBSCRIBE","market":"LTCUSDT"}'
// (integer) 1
// 127.0.0.1:6379> PUBLISH polling-channel-for-events '{"type":"SUBSCRIBE","market":"LTCUSDT"}'
// (integer) 1
// 127.0.0.1:6379> PUBLISH polling-channel-for-events '{"type":"SUBSCRIBE","market":"XRPUSDT"}'
// (integer) 1
// 127.0.0.1:6379> PUBLISH polling-channel-for-events '{"type":"SUBSCRIBE","market":"ETHUSDT"}'
// (integer) 1
// 127.0.0.1:6379> PUBLISH polling-channel-for-events '{"type":"SUBSCRIBE","market":"BTCUSDT"}'
