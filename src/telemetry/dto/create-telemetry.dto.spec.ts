import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTelemetryDto } from './create-telemetry.dto';

describe('CreateTelemetryDto', () => {
  it('should fail when required fields are missing', async () => {
    const dto = plainToInstance(CreateTelemetryDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.map(e => e.property)).toEqual(
      expect.arrayContaining(['deviceId', 'siteId', 'ts', 'metrics']),
    );
  });

  it('should fail when metrics have invalid types', async () => {
    const dto = plainToInstance(CreateTelemetryDto, {
      deviceId: 'dev-001',
      siteId: 'site-A',
      ts: new Date().toISOString(),
      metrics: { temperature: 'hot', humidity: 'wet' }, // invalid
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateTelemetryDto, {
      deviceId: 'dev-001',
      siteId: 'site-A',
      ts: new Date().toISOString(),
      metrics: { temperature: 25, humidity: 50 },
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
