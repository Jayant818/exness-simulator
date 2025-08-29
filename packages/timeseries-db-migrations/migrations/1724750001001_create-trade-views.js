exports.transaction = false;

exports.up = (pgm) => {

  // Create materialized views
  pgm.sql(`
    CREATE MATERIALIZED VIEW candles_1m 
    WITH (timescaledb.continuous) AS
    SELECT
        time_bucket('1 minute', time) AS bucket,
        symbol,
        first(price,time) AS open,
        last(price,time) AS close,
        min(price) AS low,
        max(price) AS high,
        sum(quantity) AS volume
    FROM trades
    GROUP BY bucket, symbol
    WITH NO DATA;
  `);

  pgm.sql(`
    CREATE MATERIALIZED VIEW candles_5m
    WITH (timescaledb.continuous) AS
    SELECT
        time_bucket('5 minutes', time) AS bucket,
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

  pgm.sql(`
    CREATE MATERIALIZED VIEW candles_1h
    WITH (timescaledb.continuous) AS
    SELECT
        time_bucket('1 hour', time) AS bucket,
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

  pgm.sql(`
    CREATE MATERIALIZED VIEW candles_1d
    WITH (timescaledb.continuous) AS
    SELECT
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

  // Add continuous aggregate policies
  pgm.sql(`
    SELECT add_continuous_aggregate_policy('candles_1m', 
      start_offset => INTERVAL '20 minutes', 
      end_offset => INTERVAL '1 minute', 
      schedule_interval => INTERVAL '1 minute');
  `);

  pgm.sql(`
    SELECT add_continuous_aggregate_policy('candles_5m', 
      start_offset => INTERVAL '1 hour', 
      end_offset => INTERVAL '10 minutes', 
      schedule_interval => INTERVAL '5 minutes');
  `);

  pgm.sql(`
    SELECT add_continuous_aggregate_policy('candles_1h', 
      start_offset => INTERVAL '3 hours', 
      end_offset => INTERVAL '30 minutes', 
      schedule_interval => INTERVAL '30 minutes');
  `);

  pgm.sql(`
    SELECT add_continuous_aggregate_policy('candles_1d', 
      start_offset => INTERVAL '3 days', 
      end_offset => INTERVAL '1 hour', 
      schedule_interval => INTERVAL '1 hour');
  `);
};

exports.down = (pgm) => {
  // Drop materialized views
  pgm.dropMaterializedView("candles_1m");
  pgm.dropMaterializedView("candles_5m");
  pgm.dropMaterializedView("candles_1h");
  pgm.dropMaterializedView("candles_1d");
};