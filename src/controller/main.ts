import axios from 'axios';
import * as config from 'config';
import { StatusCodes } from 'http-status-codes';
import { getLogger } from 'log4js';
import { DateTime } from 'luxon';
import { env } from 'process';
import { getRepository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import Context from '../Context';
import { OAuthToken } from '../entity/OAuthToken';
import { ResponseResult } from './type/ResponseResult';
import createHttpError = require('http-errors');

const { app } = Context;
const logger = getLogger();

type SensorState = 'open' | 'close';

app.get('/:sensorId(\\d+)/:state(open|close)', async (req, res, next) => {
  let sensorId = Number(req.params.sensorId);
  let state = req.params.state as SensorState;

  try {
    let repo = getRepository(OAuthToken);
    let oauthToken = await repo.findOne({ where: { clientId: env.ALEXA_CLIENT_ID } });
    if (!oauthToken) {
      next(createHttpError(StatusCodes.INTERNAL_SERVER_ERROR, 'OAuthToken is not found.'));
      return;
    }

    let responseEvent = await axios.post(
      config.get('alexa.api.event'),
      createEvent(oauthToken.accessToken, sensorId, state)
    );
    let statusCode = responseEvent.status;
    let resultCode = statusCode == StatusCodes.ACCEPTED
      ? ResponseResult.OK : ResponseResult.ERROR;

    res.status(statusCode).type('json').json({
      result: resultCode,
      data: responseEvent.data
    });
  } catch (e) {
    logger.error('エラーが発生しました', e);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
  }
});

function createEvent(accessToken: string, sensorId: number, state: SensorState) {
  let timeOfSample = DateTime.utc().toString();
  let stateValue = state === 'open' ? 'DETECTED' : 'NOT_DETECTED';

  return {
    context: {
      properties: [
        {
          namespace: 'Alexa.EndpointHealth',
          name: 'connectivity',
          value: { value: 'OK' },
          timeOfSample: timeOfSample,
          uncertaintyInMilliseconds: 0
        }
      ]
    },
    event: {
      header: {
        messageId: uuid(),
        namespace: 'Alexa',
        name: 'ChangeReport',
        payloadVersion: '3'
      },
      endpoint: {
        scope: {
          type: 'BearerToken',
          token: accessToken
        },
        endpointId: 'NFCContactSensor' + sensorId
      },
      payload: {
        change: {
          cause: { type: 'PHYSICAL_INTERACTION' },
          properties: [
            {
              namespace: 'Alexa.ContactSensor',
              name: 'detectionState',
              value: stateValue,
              timeOfSample: timeOfSample,
              uncertaintyInMilliseconds: 0
            }
          ]
        }
      }
    }
  };
}
