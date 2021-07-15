import * as log4js from 'log4js';
import { ConnectionOptions } from 'typeorm';
import { NamingStrategy } from '../typeorm/NamingStrategy';
import { TypeormLog4jsLogger } from '../typeorm/TypeormLog4jsLogger';

let database;

switch (process.env.NODE_ENV) {
case 'develop':
case 'production':
  // NODE_ENV=develop,production
  database = '.data/sqlite3.db';
  break;
default:
  throw new Error('NODE_ENV=' + process.env.NODE_ENV);
}

const ormconfig: ConnectionOptions = {
  type: 'sqlite',
  database: database,
  synchronize: false,
  entities: ['dst/entity/*.js'],
  migrations: ['dst/typeorm/migration/*.js'],
  cli: {
    migrationsDir: 'src/typeorm/migration'
  },
  logger: new TypeormLog4jsLogger(log4js.getLogger('sql')),
  namingStrategy: new NamingStrategy()
};

export = ormconfig;
