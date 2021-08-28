import PromiseRouter from 'express-promise-router';
import { env } from 'process';
import { getManager } from 'typeorm';
import { AlexaSensorStatus, SensorClient } from '../client/SensorClient';
import Context from '../Context';
import { ContactSensor } from '../entity/ContactSensor';

const { app } = Context;

if (!env.ALEXA_CLIENT_ID || !env.ALEXA_CLIENT_SECRET || !env.ALEXA_REFRESH_TOKEN) {
  throw new Error('env.ALEXA_* is undefined.');
}

const sensorClient = new SensorClient(
  env.ALEXA_CLIENT_ID,
  env.ALEXA_CLIENT_SECRET,
  env.ALEXA_REFRESH_TOKEN
);

const rootRouter = PromiseRouter();

rootRouter.get('/:sensorNumber(\\d+)/:command(open|close|toggle)', async (req, res) => {
  const sensorNumber = Number(req.params.sensorNumber);
  const sensorCommand = req.params.command as 'open' | 'close' | 'toggle';
  const endpointId = `alexa-skill-lambda-http-sensor-${sensorNumber}`;

  await getManager().transaction(async manager => {
    const repo = manager.getRepository(ContactSensor);
    let contactSensor = await repo.findOne({
      where: { endpointId: endpointId }
    });
    if (!contactSensor) {
      contactSensor = repo.create({
        endpointId: endpointId,
        status: 'NOT_DETECTED'
      });
    }

    let sensorStatus: AlexaSensorStatus;
    if (sensorCommand == 'open') {
      sensorStatus = 'DETECTED';
    } else if (sensorCommand == 'close') {
      sensorStatus = 'NOT_DETECTED';
    } else {
      sensorStatus = contactSensor.status == 'DETECTED'
        ? 'NOT_DETECTED' : 'DETECTED';
    }

    contactSensor.status = sensorStatus;

    const responseEvent = await sensorClient.send(endpointId, sensorStatus);
    res.status(responseEvent.status == 202 ? 200 : 500).send();

    await repo.save(contactSensor);
  });
});

app.use('/', rootRouter);
