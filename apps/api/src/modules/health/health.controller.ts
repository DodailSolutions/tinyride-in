import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { Public } from '../../common/decorators/public.decorator';
import { BRAND_IDENTITY } from '@tinyride/design-system';

@ApiTags('System & Health')
@Controller('health')
export class HealthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Public()
  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe', description: 'Returns 200 OK if service process is running' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  getLiveness() {
    return {
      status: 'ok',
      service: BRAND_IDENTITY.name,
      company: BRAND_IDENTITY.company,
      tagline: BRAND_IDENTITY.tagline,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('readiness')
  @ApiOperation({ summary: 'Readiness probe', description: 'Checks dependencies (Supabase) before serving traffic' })
  @ApiResponse({ status: 200, description: 'All dependencies healthy' })
  @ApiResponse({ status: 503, description: 'One or more dependencies unhealthy' })
  async getReadiness(@Res() res: Response) {
    const supabaseHealth = await this.supabaseService.checkHealth();

    const isReady = supabaseHealth.status === 'healthy';
    const httpStatus = isReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(httpStatus).json({
      status: isReady ? 'ready' : 'degraded',
      service: BRAND_IDENTITY.name,
      timestamp: new Date().toISOString(),
      dependencies: {
        supabase: supabaseHealth,
      },
    });
  }
}
