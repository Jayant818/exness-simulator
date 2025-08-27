# TimeScaleDB
- It is a extension of PostgresSQL.
- It allow handling of the `time-series` data much faster with the concepts like `hypertable`, `materlized views` & `continuous aggregation`.

`HyperTable` : It is a table only, but data is stored in chunks, chunking made data access faster. In the DB data is stored in chunks like `chunk_1`. so when we run any query DB engine known which chunk to look on.Chunks can be divided on day basis.
- Our normal table gets converted to the hypertable

`materlized View` : It's like when we run a query to fetch data we get a view but that's `regular view`, to get materlized view we just store that view also on DB. But there is problem with this, it can store stale data also, to avoid this we use `continuous aggregation`.

- under the hood the materlized view is hypertable only, meaning it highly optimized for time series data.
```ts
  pgm.sql(`
    CREATE MATERIALIZED VIEW candles_1d
    // This line telling DB to convert this view into continous aggregation
    WITH (timescaledb.continuous) AS
    SELECT
        //Timescale db function
        time_bucket('1 day', time) AS bucket,
        symbol,
        first(price, time) AS open,
        max(price) AS high,
        min(price) AS low,
        last(price, time) AS close,
        sum(quantity) AS volume
    FROM trades
    GROUP BY bucket, symbol
    WITH NO DATA;
  `);
```

`continous aggregation` : Its a automated materlized view. Means in the background our view keeps getting refreshed.

```ts
  pgm.sql(`
    SELECT add_continuous_aggregate_policy('candles_1d', 
    // It looks for any modifed data within a specific time window
    // The window start 3 days ago and end at 1 hour ago this 1 hr is a safety buffer to avoid aggregating data that might cahiange
      start_offset => INTERVAL '3 days', 
      end_offset => INTERVAL '1 hour',
    //   Runs every 1 hr
      schedule_interval => INTERVAL '1 hour');
  `);
```

Also we can merge the already aggregated data that got lag behind and with current data and aggregate in a single query.