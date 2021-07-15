import * as pluralize from 'pluralize';
import { DefaultNamingStrategy } from 'typeorm';
import { camelCase, snakeCase } from 'typeorm/util/StringUtils';

export class NamingStrategy extends DefaultNamingStrategy {
  tableName(targetName: string, userSpecifiedName: string | undefined): string {
    return userSpecifiedName ? userSpecifiedName : pluralize(snakeCase(targetName));
  }

  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    const name = customName || propertyName;

    if (embeddedPrefixes.length) {
      return camelCase(embeddedPrefixes.join('_')) + snakeCase(name);
    }

    return snakeCase(name);
  }
}
