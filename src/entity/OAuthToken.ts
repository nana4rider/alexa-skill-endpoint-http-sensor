import { DateTime } from 'luxon';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { DateTimeTransformer } from './transformer/DateTimeTransformer';

@Entity()
@Unique(['clientId'])
export class OAuthToken {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column('text')
  clientId!: string;

  @Column('text')
  accessToken!: string;

  @Column('text')
  refreshToken!: string;

  @Column('datetime', { transformer: DateTimeTransformer.instance })
  expire!: DateTime;

  @CreateDateColumn({ transformer: DateTimeTransformer.instance })
  readonly createdAt!: DateTime;
}
