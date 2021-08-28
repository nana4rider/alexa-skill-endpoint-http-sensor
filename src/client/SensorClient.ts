import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';

type AlexaSensorStatus = 'DETECTED' | 'NOT_DETECTED';

class SensorClient {
  static readonly API_TOKEN_URL = 'https://api.amazon.com/auth/o2/token';
  static readonly API_EVENT_URL = 'https://api.fe.amazonalexa.com/v3/events';

  private client: AxiosInstance;
  private accessToken?: string;

  constructor(private clientId: string, private clientSecret: string, private refreshToken?: string) {
    const options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=UTF-8',
        'Accept-Encoding': 'gzip'
      },
    };

    this.client = axios.create(options);

    this.client.interceptors.request.use(async requestConfig => {
      if (requestConfig.url ===  SensorClient.API_EVENT_URL && !this.accessToken) {
        this.accessToken = await this.getAccessToken();
        const data = requestConfig.data;
        data.event.endpoint.scope.token = this.accessToken;
      }
      return requestConfig;
    });

    this.client.interceptors.response.use(async response => response, async error => {
      if (error.config.url ===  SensorClient.API_EVENT_URL
        && error.response.status === 401 && !error.config._retry) {
        error.config._retry = true;
        this.accessToken = await this.getAccessToken();
        const data = JSON.parse(error.config.data);
        data.event.endpoint.scope.token = this.accessToken;
        error.config.data = JSON.stringify(data);

        return await this.client.request(error.config);
      }

      throw error;
    });
  }

  async send(endpointId: string, sensorStatus: AlexaSensorStatus): Promise<AxiosResponse<void>> {
    const now = DateTime.utc().toString();

    return this.client.post(SensorClient.API_EVENT_URL, {
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
            token: this.accessToken
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
                timeOfSample: now,
                uncertaintyInMilliseconds: 0
              }
            ]
          }
        }
      }
    });
  }

  async getRefreshToken(grantCode: string): Promise<string> {
    if (!this.refreshToken) throw new Error('refreshToken is undefined.');

    const response = await this.client.post(SensorClient.API_TOKEN_URL, {
      grant_type: 'authorization_code',
      code: grantCode,
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    return response.data.refresh_token;
  }

  async getAccessToken(): Promise<string> {
    if (!this.refreshToken) throw new Error('refreshToken is undefined.');

    const response = await this.client.post(SensorClient.API_TOKEN_URL, {
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    return response.data.access_token;
  }
}

export { SensorClient, AlexaSensorStatus };

