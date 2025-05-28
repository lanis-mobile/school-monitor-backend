import {InfluxDB} from "@influxdata/influxdb-client";
import {config} from "../config";

const influxWrite = new InfluxDB({
  url: config.influx.url, token: config.influx.token
}).getWriteApi(config.influx.org, config.influx.bucket, 's')

setInterval(() => {
  influxWrite.flush().catch(err => {
    console.error('Error flushing InfluxDB write API:', err);
  });
}, 60 * 1000); // Flush every minute

export default influxWrite;