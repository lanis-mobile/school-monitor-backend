export type configuration = {
  influx: {
    host: string;
    port: string;
    token: string;
    org: string;
    bucket: string;
  };
}

export let config: configuration = {
  influx: {
    host: process.env.INFLUX_HOST || 'localhost',
    port: process.env.INFLUX_PORT || '8086',
    token: process.env.INFLUX_TOKEN || '',
    org: process.env.INFLUX_ORG || 'my-org',
    bucket: process.env.INFLUX_BUCKET || 'my-bucket'
  }
}

console.info('---');
console.info('Configuration applied from environment variables');
console.dir(config);
console.info('---');


export function checkConfig() {
  if (config.influx.token === '') {
    console.warn('Warning: InfluxDB token is not set. Please set the INFLUX_TOKEN environment variable.');
  }
}