import {
  TypedConfigModule,
  dotenvLoader,
  selectConfig,
} from 'nest-typed-config';
import { Config } from './index.config';

export const ConfigModule = TypedConfigModule.forRoot({
  schema: Config,
  load: dotenvLoader(),
});

export const rootConfig = selectConfig(ConfigModule, Config);
