import { DateTime } from 'luxon';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { DateTimeTransformer } from './transformer/DateTimeTransformer';

@Entity()
@Unique(['provider'])
export class OAuth2 {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column('text')
  provider!: string;

  @Column('text')
  accessToken!: string;

  @Column('text')
  refreshToken!: string;

  @Column('datetime', { transformer: DateTimeTransformer.instance })
  expire!: DateTime;

  @CreateDateColumn({ transformer: DateTimeTransformer.instance })
  readonly createdAt!: DateTime;
}
