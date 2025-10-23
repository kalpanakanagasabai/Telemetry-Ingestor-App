import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../src/app.module'; 
import { TelemetryService } from '../src/telemetry/telemetry.service';

import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

describe('Telemetry E2E', () => {
  let app: INestApplication;
  let telemetryService: TelemetryService;

  const mockTelemetryData = {
    deviceId: 'dev-001',
    siteId: 'site-001',
    ts: new Date().toISOString(),
    metrics: { temperature: 60, humidity: 95 },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => {
          if (key === 'REDIS_URL') return 'redis://localhost:6379';
          if (key === 'ALERT_WEBHOOK_URL') return 'http://example.com/webhook';
          return null;
        }),
      })
      .overrideProvider(getModelToken('Telemetry'))
      .useValue({
        create: jest.fn().mockImplementation(dto => Promise.resolve(dto)),
        findOne: jest.fn().mockResolvedValue(mockTelemetryData),
        aggregate: jest.fn().mockResolvedValue([
          {
            count: 1,
            avgTemperature: 60,
            maxTemperature: 60,
            avgHumidity: 95,
            maxHumidity: 95,
            uniqueDevices: 1,
          },
        ]),
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    telemetryService = moduleRef.get<TelemetryService>(TelemetryService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should ingest telemetry and trigger alert', async () => {
    const spyAlert = jest
      .spyOn(telemetryService as any, 'sendAlert')
      .mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post('/telemetry')
      .send(mockTelemetryData)
      .expect(201);

    expect(spyAlert).toHaveBeenCalledTimes(2); // temperature & humidity
    expect(spyAlert).toHaveBeenCalledWith(
      expect.objectContaining(mockTelemetryData),
      'HIGH_TEMPERATURE',
      60
    );
    expect(spyAlert).toHaveBeenCalledWith(
      expect.objectContaining(mockTelemetryData),
      'HIGH_HUMIDITY',
      95
    );
  });

  it('should fallback to Mongo when latest cache is missing', async () => {
    const latest = await telemetryService.getLatest(mockTelemetryData.deviceId);
    expect(latest).toEqual(mockTelemetryData);
  });

  it('should return correct site summary aggregation', async () => {
    const summary = await telemetryService.getSiteSummary(
      mockTelemetryData.siteId,
      new Date().toISOString(),
      new Date().toISOString()
    );

    expect(summary).toEqual({
      count: 1,
      avgTemperature: 60,
      maxTemperature: 60,
      avgHumidity: 95,
      maxHumidity: 95,
      uniqueDevices: 1,
    });
  });
});
