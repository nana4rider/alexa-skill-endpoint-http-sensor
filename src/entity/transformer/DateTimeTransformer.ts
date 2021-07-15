import { DateTime } from 'luxon';
import { ValueTransformer } from 'typeorm';

export class DateTimeTransformer implements ValueTransformer {
  private static _instance: DateTimeTransformer;

  private constructor() {
  }

  public static get instance(): DateTimeTransformer {
    if (!this._instance) {
      this._instance = new DateTimeTransformer();
    }
    return this._instance;
  }

  public from(value: Date | DateTime): DateTime | undefined {
    if (!value) return;
    else if (value instanceof DateTime) return value;
    return DateTime.fromJSDate(value);
  }

  public to(value: DateTime): Date | undefined {
    if (!value) return;
    return value.toJSDate();
  }
}
