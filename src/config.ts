export type configuration = {
  jwtSecret: string;
  pgDB: {
    host: string;
    username: string;
    port: number;
    password: string;
    database: string;
  };
}

export let config: configuration = {
  jwtSecret: 'secret',
  pgDB: {
    host: 'localhost',
    port: 5432,
    database: 'school-monitor',
    username: 'user',
    password: 'password',
  }
}

export function applyConfigFromEnv(): configuration {
  config = {
    jwtSecret: process.env.JWT_SECRET || config.jwtSecret,
    pgDB: {
      port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : config.pgDB.port,
      host: process.env.PG_HOST || config.pgDB.host,
      username: process.env.PG_USER || config.pgDB.username,
      password: process.env.PG_PASSWORD || config.pgDB.password,
      database: process.env.PG_DATABASE || config.pgDB.database
    }
  }
  console.info('---');
  console.info('Configuration applied from environment variables');
  console.dir(config);
  console.info('---');
  if (config.jwtSecret === 'secret') {
    console.warn('Warning: JWT secret is set to default value. Please change it in production');
  }
  return config;
}