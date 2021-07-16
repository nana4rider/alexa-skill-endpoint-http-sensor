import axios from 'axios';
import * as compression from 'compression';
import * as config from 'config';
import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import { HttpError } from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import * as log4js from 'log4js';
import * as luxon from 'luxon';
import { createConnection } from 'typeorm';
import * as log4jconfig from './config/log4js';
import * as ormconfig from './config/ormconfig';
import Context from './Context';
import { ResponseResult } from './controller/type/ResponseResult';
import { updateTokenTimer } from './timer/updateToken';

const { app } = Context;

// Luxon
const locale: string = config.get('date.locale');
const timezone: string = config.get('date.timezone');
luxon.Settings.defaultLocale = locale;
luxon.Settings.defaultZoneName = timezone;
luxon.Settings.throwOnInvalid = true;

// log4js
log4js.configure(log4jconfig.configures[process.env.NODE_ENV!]);
const logger = log4js.getLogger();
const accessLogger = log4js.getLogger('access');
const requestLogger = log4js.getLogger('request');

logger.info('- Alexa Event Gateway Start -');

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at:', p, 'reason:', reason);
});

void (async () => {
  await createConnection(ormconfig);
  logger.info('- Connection created -');
})();

// Express
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(log4js.connectLogger(accessLogger, { level: 'INFO' }));

// Web apps
require('./controller/main');

app.get('/', (req, res) => {
  res.writeHead(StatusCodes.OK, { 'Content-Type': 'text/plain' });
  res.end('Alexa Event Gateway');
});

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(error);

  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode);
    res.send({
      result: ResponseResult.ERROR,
      errorMessage: error.message
    });
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.send({
      result: ResponseResult.ERROR,
      errorMessage: 'エラーが発生しました。'
    });
  }
});

app.listen(process.env.PORT || 80, () => {
  logger.info('- HTTP Server Start -');
  void updateTokenTimer(3);
});

// axios
axios.defaults.headers.common['Accept-Encoding'] = 'gzip';
if (requestLogger.isDebugEnabled()) {
  axios.interceptors.request.use(request => {
    let method = request.method?.toUpperCase();
    let options;
    if (request.params) {
      options = request.params;
    } else if (request.data) {
      options = request.data.toString();
    } else {
      options = '';
    }
    requestLogger.debug(`[${method}]`, request.url, options);
    return request;
  });
}
