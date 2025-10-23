// src/telemetry/telemetry.controller.ts
import { Controller, Post, Body, Get, Param, Query, UsePipes, ValidationPipe, Req, UnauthorizedException } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';

import type { Request } from 'express';

@Controller('api/v1')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post('telemetry')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() dto: CreateTelemetryDto, @Req() req: Request) {
    // Optional simple bearer auth
    const token = req.headers['authorization']?.split(' ')[1];
    if (process.env.INGEST_TOKEN && token !== process.env.INGEST_TOKEN) {
      throw new UnauthorizedException('Invalid token');
    }
    return this.telemetryService.create(dto);
  }

  @Get('devices/:deviceId/latest')
  async latest(@Param('deviceId') deviceId: string) {
    return this.telemetryService.getLatest(deviceId);
  }

  @Get('sites/:siteId/summary')
  async summary(@Param('siteId') siteId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.telemetryService.getSiteSummary(siteId, from, to);
  }
}

