import axios from 'axios';
import { getLogger } from 'log4js';
import { DateTime } from 'luxon';
import { env } from 'process';
import { v4 as uuid } from 'uuid';
import Context from '../Context';
// import createHttpError = require('http-errors');

const { app } = Context;
const logger = getLogger();

app.get('/:number/:state(open|close)', async (req, res) => {
  let number = req.params.number;
  // TODO
  if (!req.params.number) throw new Error('Number is empty.');

  const oldRefreshToken = 'Atzr|IwEBIBpouO-mEa7vnSIsmo_UAfrA32I1nE7w_MU0XdQqcnuAn3suJ7R0KStgHGp2fA3GIfIm2XeFNl21MqEHqitVOy0nXyGahmrnjVGy-ZnUyP_sDwrwvZ_17_6CbzgXipnj-v1qkgHKKNGuhziqBQO1oFrRU5LOA6yOVEBRCuProXTt5JbIip0UuprZX5xdI_BysQNM6iZnlxGg8DP4xWbvEQXZfzm0C_x6m4VexjFmg-HSu04yEr1pBLq0I_WRM2xk3E73fVzWRQSuunnV3TM0rJug';

  try {
    let responseRefresh = await axios.post('https://api.amazon.com/auth/o2/token', {
      'grant_type': 'refresh_token',
      'refresh_token': oldRefreshToken,
      'client_id': env.ALEXA_CLIENT_ID,
      'client_secret': env.ALEXA_CLIENT_SECRET
    });

    let accessToken = responseRefresh.data.access_token;
    let refreshToken = responseRefresh.data.refresh_token;
    let endpointId = 'NFCContactSensor' + number;
    let timeOfSample = DateTime.utc().toString();

    let responseEvent = await axios.post('https://api.fe.amazonalexa.com/v3/events', {
      'context': {
        'properties': [
          {
            'namespace': 'Alexa.EndpointHealth',
            'name': 'connectivity',
            'value': { 'value': 'OK' },
            'timeOfSample': timeOfSample,
            'uncertaintyInMilliseconds': 0
          }
        ]
      },
      'event': {
        'header': {
          'messageId': uuid(),
          'namespace': 'Alexa',
          'name': 'ChangeReport',
          'payloadVersion': '3'
        },
        'endpoint': {
          'scope': {
            'type': 'BearerToken',
            'token': accessToken
          },
          'endpointId': endpointId
        },
        'payload': {
          'change': {
            'cause': { 'type': 'PHYSICAL_INTERACTION' },
            'properties': [
              {
                'namespace': 'Alexa.ContactSensor',
                'name': 'detectionState',
                'value': 'DETECTED',
                'timeOfSample': timeOfSample,
                'uncertaintyInMilliseconds': 0
              }
            ]
          }
        }
      }
    });

    res.type('json').json(responseEvent.data);
  } catch (e) {
    logger.error('エラーが発生しました', e);

    res.type('json').json({ 'error': e });
  }

});
