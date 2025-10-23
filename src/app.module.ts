// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TelemetryModule } from './telemetry/telemetry.module';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGO_URI: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        ALERT_WEBHOOK_URL: Joi.string().required(),
        INGEST_TOKEN: Joi.string().optional(),
        PORT: Joi.number().optional(),
      }),
    }),
    // Use ConfigService to safely get MONGO_URI
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    TelemetryModule,
  ],
})
export class AppModule {}
