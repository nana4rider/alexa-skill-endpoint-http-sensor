import { Logger } from 'log4js';
import { Logger as TypeormLogger, QueryRunner } from 'typeorm';

// base: https://github.com/typeorm/typeorm/blob/master/src/logger/FileLogger.ts
export class TypeormLog4jsLogger implements TypeormLogger {
  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------
  constructor(private logger: Logger) {
  }
  // -------------------------------------------------------------------------
  // Public Methods
  // -------------------------------------------------------------------------
  /**
   * Logs query and parameters used in it.
   */
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): void {
    var sql = query + (parameters && parameters.length ? ' -- PARAMETERS: ' + this.stringifyParams(parameters) : '');
    this.logger.debug('[QUERY]:', sql);
  };
  /**
   * Logs query that is failed.
   */
  logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner): void {
    if (!this.logger.isErrorEnabled()) return;

    var sql = query + (parameters && parameters.length ? ' -- PARAMETERS: ' + this.stringifyParams(parameters) : '');
    this.logger.error([
      '[FAILED QUERY]:', sql,
      '[QUERY ERROR]:', error
    ]);
  };
  /**
   * Logs query that is slow.
   */
  logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner): void {
    if (!this.logger.isWarnEnabled()) return;

    var sql = query + (parameters && parameters.length ? ' -- PARAMETERS: ' + this.stringifyParams(parameters) : '');
    this.logger.warn('[SLOW QUERY:', time, 'ms]:', sql);
  };
  /**
   * Logs events from the schema build process.
   */
  logSchemaBuild(message: string, queryRunner?: QueryRunner): void {
    this.logger.info(message);
  };
  /**
   * Logs events from the migrations run process.
   */
  logMigration(message: string, queryRunner?: QueryRunner): void {
    this.logger.info(message);
  };
  /**
   * Perform logging using given logger, or by default to the console.
   * Log has its own level and message.
   */
  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner): void {
    switch (level) {
    case 'log':
      this.logger.debug(message);
      break;
    case 'info':
      this.logger.info(message);
      break;
    case 'warn':
      this.logger.warn(message);
      break;
    }
  };
  /**
   * Converts parameters to a string.
   * Sometimes parameters can have circular objects and therefor we are handle this case too.
   */
  protected stringifyParams(parameters: any[]): string | any[] {
    try {
      return JSON.stringify(parameters);
    }
    catch (error) { // most probably circular objects in parameters
      return parameters;
    }
  };
}
