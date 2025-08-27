# TimeScaleDB
- It is a extension of PostgresSQL.
- It allow handling of the `time-series` data much faster with the concepts like `hypertable`, `materlized views` & `continuous aggregation`.

`HyperTable` : It is a table only, but data is stored in chunks, chunking made data access faster. In the DB data is stored in chunks like `chunk_1`. so when we run any query DB engine known which chunk to look on.Chunks can be divided on day basis.
- Our normal table gets converted to the hypertable

`materlized View` : It's like when we run a query to fetch data we get a view but that's `regular view`, to get materlized view we just store that view also on DB. But there is problem with this, it can store stale data also, to avoid this we use `continuous aggregation`.

`continous aggregation` : Its a automated materlized view. Means in the background our view keeps getting refreshed.