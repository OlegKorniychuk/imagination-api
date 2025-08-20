import { plainToInstance } from 'class-transformer';
import {
  IsNumberString,
  IsString,
  validateSync,
  ValidationError,
} from 'class-validator';

export class EnvironmentalVariables {
  @IsString()
  DATABASE_URL: string;

  @IsNumberString()
  PORT: string;
}

export const validate = (
  config: Record<string, unknown>,
): EnvironmentalVariables => {
  const configObject = plainToInstance(EnvironmentalVariables, config, {
    enableImplicitConversion: true,
  });

  const errors: ValidationError[] = validateSync(configObject);

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return configObject;
};
