// src/telemetry/dto/create-telemetry.dto.ts
import { IsString, IsNotEmpty, IsISO8601, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MetricsDto {
  @IsNumber()
  temperature: number;

  @IsNumber()
  humidity: number;
}

export class CreateTelemetryDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsNotEmpty()
  siteId: string;

  @IsISO8601()
  ts: string;

  @ValidateNested()
  @Type(() => MetricsDto)
  metrics: MetricsDto;
}
