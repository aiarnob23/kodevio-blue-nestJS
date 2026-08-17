import { plainToInstance } from 'class-transformer';
import {
  IsEmail,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

class AdminSeedConfig {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}

const config = plainToInstance(AdminSeedConfig, {
  email: process.env.DEFAULT_ADMIN_EMAIL,
  password: process.env.DEFAULT_ADMIN_PASS,
  firstName: process.env.DEFAULT_ADMIN_FIRST_NAME,
  lastName: process.env.DEFAULT_ADMIN_LAST_NAME,
});

const errors = validateSync(config, {
  skipMissingProperties: false,
});

if (errors.length > 0) {
  throw new Error(
    `Invalid default admin configuration:\n${errors
      .map((error) =>
        Object.values(error.constraints ?? {}).join(', '),
      )
      .join('\n')}`,
  );
}

export const adminSeedConfig = {
  email: config.email.toLowerCase().trim(),
  password: config.password,
  firstName: config.firstName,
  lastName: config.lastName,
};