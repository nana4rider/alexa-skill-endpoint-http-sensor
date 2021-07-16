import axios from 'axios';
import * as config from 'config';
import { StatusCodes } from 'http-status-codes';
import { getLogger } from 'log4js';
import { DateTime } from 'luxon';
import { env } from 'process';
import { getManager, getRepository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import Context from '../Context';
import { ContactSensor } from '../entity/ContactSensor';
import { OAuthToken } from '../entity/OAuthToken';
import { AlexaSensorStatus } from '../entity/type/AlexaSensorStatus';
import { ResponseResult } from './type/ResponseResult';
import createHttpError = require('http-errors');

const { app } = Context;
const logger = getLogger();

type SensorCommand = 'open' | 'close' | 'toggle';

app.get('/:sensorId(\\d+)/:command(open|close|toggle)', async (req, res, next) => {
  let sensorId = Number(req.params.sensorId);
  let sensorCommand = req.params.command as SensorCommand;
  let endpointId = 'NFCContactSensor' + sensorId;

  try {
    let repo = getRepository(OAuthToken);
    let oauthToken = await repo.findOne({ where: { clientId: env.ALEXA_CLIENT_ID } });
    if (!oauthToken) {
      next(createHttpError(StatusCodes.INTERNAL_SERVER_ERROR, 'OAuthToken is not found.'));
      return;
    }

    let sensorStatus : AlexaSensorStatus;

    await getManager().transaction(async manager => {
      let repo = manager.getRepository(ContactSensor);
      let contactSensor = await repo.findOne({
        where: { endpointId: endpointId }
      });
      if (!contactSensor) {
        contactSensor = repo.create({
          endpointId: endpointId,
          status: 'NOT_DETECTED'
        });
      }

      if (sensorCommand == 'open') {
        sensorStatus = 'DETECTED';
      } else if (sensorCommand == 'close') {
        sensorStatus = 'NOT_DETECTED';
      } else { // toggle
        sensorStatus = contactSensor.status == 'DETECTED'
          ? 'NOT_DETECTED' : 'DETECTED';
      }

      contactSensor.status = sensorStatus;

      await repo.save(contactSensor);
    });

    let responseEvent = await axios.post(
      config.get('alexa.api.event'),
      createEvent(oauthToken.accessToken, endpointId, sensorStatus!)
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

function createEvent(accessToken: string, endpointId: string, sensorStatus: AlexaSensorStatus) {
  let timeOfSample = DateTime.utc().toString();

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
              value: sensorStatus,
              timeOfSample: timeOfSample,
              uncertaintyInMilliseconds: 0
            }
          ]
        }
      }
    }
  };
}
