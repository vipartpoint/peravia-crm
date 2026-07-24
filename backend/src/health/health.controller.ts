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
    if (!process.env.REDIS_HOST) throw new Error('REDIS_HOST environment variable is missing');
    if (!process.env.REDIS_PORT) throw new Error('REDIS_PORT environment variable is missing');
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  @Get()
  @HealthCheck()
  async check() {
    const isProd = process.env.NODE_ENV === 'production';
    if (!process.env.MINIO_ENDPOINT) throw new Error('MINIO_ENDPOINT environment variable is missing');
    if (!process.env.MINIO_PORT) throw new Error('MINIO_PORT environment variable is missing');
    const minioEndpoint = process.env.MINIO_ENDPOINT;
    const minioPort = process.env.MINIO_PORT;
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
