// src/telemetry/telemetry.module.ts
import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Telemetry, TelemetrySchema } from './telemetry.schema';


@Module({
  imports: [MongooseModule.forFeature([{ name: Telemetry.name, schema: TelemetrySchema }])],
  controllers: [TelemetryController],
  providers: [TelemetryService],
})
export class TelemetryModule {}
