import { DateTime } from 'luxon';
import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { DateTimeTransformer } from './transformer/DateTimeTransformer';

@Entity('oauth_token')
export class OAuthToken {
  @PrimaryColumn('text')
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
