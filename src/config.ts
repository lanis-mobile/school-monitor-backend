export type configuration = {
  influx: {
    url: string;
    token: string;
    org: string;
    bucket: string;
  };
}

export let config: configuration = {
  influx: {
    url: process.env.INFLUX_URL || 'http://localhost:8086',
    token: process.env.INFLUX_TOKEN || '',
    org: process.env.INFLUX_ORG || 'my-org',
    bucket: process.env.INFLUX_BUCKET || 'my-bucket'
  }
}

export function applyConfigFromEnv(): configuration {
  config = {
    influx: {
      url: process.env.INFLUX_URL || 'http://localhost:8086',
      token: process.env.INFLUX_TOKEN || '',
      org: process.env.INFLUX_ORG || 'my-org',
      bucket: process.env.INFLUX_BUCKET || 'my-bucket'
    }
  }
  console.info('---');
  console.info('Configuration applied from environment variables');
  console.dir(config);
  console.info('---');
  if (config.influx.token === '') {
    console.warn('Warning: InfluxDB token is not set. Please set the INFLUX_TOKEN environment variable.');
  }
  return config;
}