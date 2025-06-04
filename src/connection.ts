import {InfluxDB} from "@influxdata/influxdb-client";
import {config} from "./config";

const influx = new InfluxDB({
  // this connection is only used for server-internal data transfers, so http is fine
  url: `http://${config.influx.host}:${config.influx.port}`, token: config.influx.token
})

const influxWrite = influx.getWriteApi(config.influx.org, config.influx.bucket, 's')

setInterval(async () => {
  await influxWrite.flush().catch(err => {
    console.error('Error flushing InfluxDB write API:', err);
  });
}, 60 * 500); // Flush every half a minute

export default influxWrite;