exports.up = (pgm) => {
  pgm.createTable("trades", {
    time: { type: "timestamp with time zone", notNull: true },
    symbol: {
      type: "text",
      notNull: true,
    },
    price: {
      type: "decimal",
      notNull: true,
    },
    quantity: {
      type: "decimal",
      notNull: true,
    },
    tradeId: { type: "bigint", notNull: true },
  },
  {
    constraints: {
      primaryKey: ['time', 'tradeId', 'symbol']
    }
  }
  );
  
  pgm.sql(`SELECT create_hypertable('trades','time');`);

  // Indexes
  pgm.createIndex("trades", [
    "symbol",
    { name: "time", sort: "DESC" },
  ]);

};

exports.down = (pgm) => {
  pgm.dropIndex("trades", ["symbol", "time"]);
  pgm.dropTable("trades");
};