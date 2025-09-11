import { Injectable } from '@nestjs/common';
import { Config } from 'config/index.config';

@Injectable()
export class DrizzleService {
  constructor(private config: Config) {}
}
