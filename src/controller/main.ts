import axios from 'axios';
import * as config from 'config';
import { StatusCodes } from 'http-status-codes';
import { getLogger } from 'log4js';
import { DateTime } from 'luxon';
import { getRepository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import Context from '../Context';
import { OAuth2 } from '../entity/OAuth2';
import { ResponseResult } from './type/ResponseResult';
import createHttpError = require('http-errors');

const { app } = Context;
const logger = getLogger();

type SensorState = 'open' | 'close';

app.get('/:number/:state(open|close)', async (req, res, next) => {
  let number = req.params;
  let state = req.params.state as SensorState;

  try {
    let repo = getRepository(OAuth2);
    let oauth2 = await repo.findOne({ where: { provider: 'alexa' } });
    if (!oauth2) {
      next(createHttpError(StatusCodes.INTERNAL_SERVER_ERROR, 'OAuth2 Data is not found.'));
      return;
    }

    let endpointId = 'NFCContactSensor' + number;
    let responseEvent = await axios.post(
      config.get('alexa.api.event'),
      createEvent(oauth2.accessToken, endpointId, state)
    );
    let statusCode = responseEvent.status;

    res.status(statusCode).type('json').json({
      result: statusCode ==  ResponseResult.OK,
      data: responseEvent.data
    });
  } catch (e) {
    logger.error('エラーが発生しました', e);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
  }
});

function createEvent(accessToken: string, endpointId: string, state: SensorState) {
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
        endpointId: endpointId
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