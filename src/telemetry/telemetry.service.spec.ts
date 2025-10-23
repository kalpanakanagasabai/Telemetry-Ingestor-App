import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryService } from './telemetry.service';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';

// Mock TelemetryModel as a class with save()
// Mock TelemetryModel as a class with save()
class MockTelemetryModel {
  private data: any;

  constructor(data: any) {
    this.data = data;
  }

  save() {
    return Promise.resolve(this); // return the instance to mimic Mongoose behavior
  }
}


// Mock Redis client
const mockRedisClient = {
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  disconnect: jest.fn(),
};

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'REDIS_URL') return 'redis://localhost:6379';
    if (key === 'ALERT_WEBHOOK_URL') return 'http://localhost/webhook';
    return null;
  }),
};

describe('TelemetryService', () => {
  let service: TelemetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryService,
        { provide: getModelToken('Telemetry'), useValue: MockTelemetryModel },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: 'REDIS_CLIENT', useValue: mockRedisClient },
      ],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);

    // Override Redis in service for testing
    (service as any).redis = mockRedisClient;
  });

  afterAll(() => {
    mockRedisClient.disconnect();
  });

  it('should save telemetry to Mongo and update Redis', async () => {
    const dto: CreateTelemetryDto = {
      deviceId: 'dev-001',
      siteId: 'site-001',
      ts: new Date().toISOString(),
      metrics: { temperature: 30, humidity: 40 },
    };

    const telemetry = await service.create(dto);

    // Mongo save called
    expect(telemetry.save).toHaveBeenCalled();

    // Redis set called
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      `latest:${dto.deviceId}`,
      expect.any(String),
    );
  });

  it('should trigger alert for high temperature', async () => {
    const dto: CreateTelemetryDto = {
      deviceId: 'dev-001',
      siteId: 'site-001',
      ts: new Date().toISOString(),
      metrics: { temperature: 100, humidity: 40 },
    };

    const spyAlert = jest.spyOn<any, any>(service as any, 'sendAlert').mockResolvedValue(null);

    await service.create(dto);

    expect(spyAlert).toHaveBeenCalledWith(dto, 'HIGH_TEMPERATURE', 100);
  });

  it('should trigger alert for high humidity', async () => {
    const dto: CreateTelemetryDto = {
      deviceId: 'dev-001',
      siteId: 'site-001',
      ts: new Date().toISOString(),
      metrics: { temperature: 30, humidity: 95 },
    };

    const spyAlert = jest.spyOn<any, any>(service as any, 'sendAlert').mockResolvedValue(null);

    await service.create(dto);

    expect(spyAlert).toHaveBeenCalledWith(dto, 'HIGH_HUMIDITY', 95);
  });
});
