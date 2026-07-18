import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck, PrismaHealthIndicator, DiskHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';

@Controller('health')
export class HealthController {
  private redisClient: Redis;

  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private prisma: PrismaService,
  ) {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  @Get()
  @HealthCheck()
  async check() {
    const isProd = process.env.NODE_ENV === 'production';
    const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const minioPort = process.env.MINIO_PORT || '9000';
    const minioUrl = `http://${minioEndpoint}:${minioPort}/minio/health/live`;

    const result = await this.health.check([
      // Database Check
      () => this.prismaHealth.pingCheck('postgres', this.prisma),
      
      // Redis Check
      async () => {
        try {
          await this.redisClient.ping();
          return { redis: { status: 'up' } };
        } catch (e) {
          return { redis: { status: 'down', message: 'Redis connection failed' } };
        }
      },

      // MinIO Check
      () => this.http.pingCheck('minio', minioUrl).catch(() => ({ minio: { status: 'down' } })),

      // Disk Space Check (ensure it does not exceed 85%)
      () => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.85 }),

      // Memory Usage Check (ensure heap is under 1GB)
      () => this.memory.checkHeap('memory_heap', 1024 * 1024 * 1024),
    ]);

    return {
      status: result.status,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      details: result.details,
    };
  }
}
