import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Telemetry, TelemetryDocument } from './telemetry.schema';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import Redis from 'ioredis';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelemetryService {
  private redis: Redis;
  private webhookUrl: string;

  constructor(
    @InjectModel(Telemetry.name) private telemetryModel: Model<TelemetryDocument>,
    private configService: ConfigService,
  ) {
    // Get environment variables from ConfigService
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const webhookUrl = this.configService.get<string>('ALERT_WEBHOOK_URL');

    // Validate environment variables
    if (!redisUrl) throw new Error('REDIS_URL is missing in .env');
    if (!webhookUrl) throw new Error('ALERT_WEBHOOK_URL is missing in .env');

    // Initialize Redis and webhook
    this.redis = new Redis(redisUrl);
    this.webhookUrl = webhookUrl;
  }

  async create(dto: CreateTelemetryDto) {
    // Save to MongoDB
    const telemetry = new this.telemetryModel({ ...dto, ts: new Date(dto.ts) });
    await telemetry.save();

    // Cache latest in Redis
    await this.redis.set(`latest:${dto.deviceId}`, JSON.stringify(telemetry));

    // Check thresholds and send alerts
    if (dto.metrics.temperature > 50) {
      await this.sendAlert(dto, 'HIGH_TEMPERATURE', dto.metrics.temperature);
    }
    if (dto.metrics.humidity > 90) {
      await this.sendAlert(dto, 'HIGH_HUMIDITY', dto.metrics.humidity);
    }

    return telemetry;
  }

  private async sendAlert(dto: CreateTelemetryDto, reason: string, value: number) {
    try {
      await axios.post(this.webhookUrl, {
        deviceId: dto.deviceId,
        siteId: dto.siteId,
        ts: dto.ts,
        reason,
        value,
      });
    } catch (err: any) {
      console.error('Alert failed:', err.message);
    }
  }

  async getLatest(deviceId: string) {
    const cached = await this.redis.get(`latest:${deviceId}`);
    if (cached) return JSON.parse(cached);

    // Fallback to MongoDB
    const telemetry = await this.telemetryModel.findOne({ deviceId }).sort({ ts: -1 });
    if (telemetry) await this.redis.set(`latest:${deviceId}`, JSON.stringify(telemetry));
    return telemetry;
  }

  async getSiteSummary(siteId: string, from: string, to: string) {
    const result = await this.telemetryModel.aggregate([
      { $match: { siteId, ts: { $gte: new Date(from), $lte: new Date(to) } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgTemperature: { $avg: '$metrics.temperature' },
          maxTemperature: { $max: '$metrics.temperature' },
          avgHumidity: { $avg: '$metrics.humidity' },
          maxHumidity: { $max: '$metrics.humidity' },
          uniqueDevices: { $addToSet: '$deviceId' },
        },
      },
      {
        $project: {
          _id: 0,
          count: 1,
          avgTemperature: 1,
          maxTemperature: 1,
          avgHumidity: 1,
          maxHumidity: 1,
          uniqueDevices: { $size: '$uniqueDevices' },
        },
      },
    ]);

    return result[0] || {};
  }
}
