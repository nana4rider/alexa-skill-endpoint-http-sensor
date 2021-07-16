import axios from 'axios';
import * as config from 'config';
import { getLogger } from 'log4js';
import { DateTime } from 'luxon';
import { env } from 'process';
import { getManager } from 'typeorm';
import { OAuth2 } from '../entity/OAuth2';

const logger = getLogger();

/**
 * Alexaのアクセストークンを更新するタイマー処理です
 *
 * @param interval
 */
export async function updateTokenTimer(interval: number) {
  setTimeout(async () => {
    // エラーが発生した場合、60秒後にリトライ
    let nextInterval = 60;

    try {
      nextInterval = await updateToken();
    } catch (e) {
      logger.error(e);
    } finally {
      setImmediate(() => updateTokenTimer(nextInterval));
    }
  }, interval * 1000);
}

/**
 * Alexaのアクセストークンを更新します
 *
 * @returns 次回の更新時間
 */
async function updateToken() {
  let nextInterval = 0;

  await getManager().transaction(async manager => {
    let repo = manager.getRepository(OAuth2);
    let oauth2 = await repo.findOne({
      where: { provider: 'alexa' },
      lock: { mode: 'pessimistic_write' }
    });
    if (!oauth2) {
      throw new Error('OAuth2 Data is not found.');
    }

    let responseToken = await axios.post(
      config.get('alexa.api.token'),
      {
        grant_type: 'refresh_token',
        refresh_token: oauth2.refreshToken,
        client_id: env.ALEXA_CLIENT_ID,
        client_secret: env.ALEXA_CLIENT_SECRET
      }
    );

    let responseData = responseToken.data;
    let expiresIn = responseData.expires_in;
    let expire = DateTime.fromHTTP(responseToken.headers.date).plus({ seconds: expiresIn });

    oauth2.accessToken = responseData.access_token;
    oauth2.refreshToken = responseData.refresh_token;
    oauth2.expire = expire;

    await repo.save(oauth2);

    logger.info('OAuth2 updated');
    nextInterval = expiresIn - 60;
  });

  if (nextInterval <= 0) throw new Error('nextInterval <= 0');

  // 有効期限の60秒前に次回の更新を行う
  return nextInterval;
}
