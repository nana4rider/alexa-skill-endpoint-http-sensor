import { DateTime } from 'luxon';
import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { DateTimeTransformer } from 'typeorm-util-ts';
import { AlexaSensorStatus } from '../client/SensorClient';

@Entity()
export class ContactSensor {
  @PrimaryColumn('text')
  endpointId!: string;

  @Column('text')
  status!: AlexaSensorStatus;

  @CreateDateColumn({ transformer: DateTimeTransformer.instance })
  readonly createdAt!: DateTime;
}
