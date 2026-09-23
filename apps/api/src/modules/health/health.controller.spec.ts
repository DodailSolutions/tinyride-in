import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';

describe('HealthController', () => {
  let controller: HealthController;
  let supabaseService: jest.Mocked<Partial<SupabaseService>>;

  beforeEach(async () => {
    supabaseService = {
      checkHealth: jest.fn().mockResolvedValue({ status: 'healthy', latencyMs: 15 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: SupabaseService,
          useValue: supabaseService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return liveness ok', () => {
    const result = controller.getLiveness();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('TinyRide');
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('should return readiness 200 when Supabase is healthy', async () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await controller.getReadiness(mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ready',
        service: 'TinyRide',
      }),
    );
  });

  it('should return readiness 503 when Supabase is unhealthy', async () => {
    supabaseService.checkHealth = jest.fn().mockResolvedValue({
      status: 'unhealthy',
      latencyMs: 100,
      error: 'Connection timeout',
    });

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await controller.getReadiness(mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'degraded',
      }),
    );
  });
});
