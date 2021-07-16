import { DateTime } from 'luxon';
import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { DateTimeTransformer } from './transformer/DateTimeTransformer';
import { AlexaSensorStatus as AlexaSensorStatus } from './type/AlexaSensorStatus';

@Entity()
export class ContactSensor {
  @PrimaryColumn('text')
  endpointId!: string;

  @Column('text')
  status!: AlexaSensorStatus;

  @CreateDateColumn({ transformer: DateTimeTransformer.instance })
  readonly createdAt!: DateTime;
}
