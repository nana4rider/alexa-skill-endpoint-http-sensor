import { Appender, Configuration, DateFileAppender, LoggingEvent, PatternLayout } from 'log4js';
import { DateTime } from 'luxon';

const baseLogDir = '.data/log';
const dateTimeFormat = 'yyyy-MM-dd\'T\'HH:mm:ss.SSS';

const consoleLayout: PatternLayout = {
  type: 'pattern',
  pattern: '%[[%x{ld}] [%p] %c -%] %m',
  tokens: { ld: getLocalDate }
};

const fileLayout: PatternLayout = {
  type: 'pattern',
  pattern: '[%x{ld}] [%p] %c - %m',
  tokens: { ld: getLocalDate }
};

const appenders: { [name: string]: Appender } = {
  console: {
    type: 'console',
    layout: consoleLayout
  },
  error: {
    type: 'logLevelFilter',
    appender: 'error_filtered',
    level: 'error'
  },
  error_filtered: dateFile('error.log', 10),
  system: dateFile('system.log', 10),
  access: dateFile('access.log', 10),
  request: dateFile('request.log', 10),
  sql: {
    type: 'file',
    layout: fileLayout,
    filename: `${baseLogDir}/sql.log`,
    maxLogSize: 5242880,
    backups: 5
  }
};

export const configures: { [key: string]: Configuration } = {};

// NODE_ENV=develop
configures.develop = {
  appenders: appenders,
  categories: {
    default: {
      appenders: ['error', 'console', 'system'],
      level: 'DEBUG'
    },
    access: {
      appenders: ['error', 'access'],
      level: 'DEBUG'
    },
    request: {
      appenders: ['error', 'request'],
      level: 'DEBUG'
    },
    sql: {
      appenders: ['error', 'sql'],
      level: 'DEBUG'
    }
  }
};

// NODE_ENV=production
configures.production = {
  appenders: appenders,
  categories: {
    default: {
      appenders: ['error', 'console', 'system'],
      level: 'INFO'
    },
    access: {
      appenders: ['error', 'access'],
      level: 'INFO'
    },
    request: {
      appenders: ['error', 'request'],
      level: 'INFO'
    },
    sql: {
      appenders: ['error', 'sql'],
      level: 'INFO'
    }
  }
};

function getLocalDate(logEvent: LoggingEvent): string {
  return DateTime.fromJSDate(logEvent.startTime).toFormat(dateTimeFormat);
}

function dateFile(fileName: string, daysToKeep: number): DateFileAppender {
  return {
    type: 'dateFile',
    layout: fileLayout,
    filename: `${baseLogDir}/${fileName}`,
    pattern: '-yyyy-MM-dd',
    daysToKeep: daysToKeep
  };
}
