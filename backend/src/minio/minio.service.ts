import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;
  private readonly bucketName = 'cheques';

  constructor() {
    if (!process.env.MINIO_ENDPOINT) throw new Error('MINIO_ENDPOINT environment variable is missing');
    if (!process.env.MINIO_PORT) throw new Error('MINIO_PORT environment variable is missing');
    if (!process.env.MINIO_ACCESS_KEY) throw new Error('MINIO_ACCESS_KEY environment variable is missing');
    if (!process.env.MINIO_SECRET_KEY) throw new Error('MINIO_SECRET_KEY environment variable is missing');

    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: parseInt(process.env.MINIO_PORT),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    });
  }

  async onModuleInit() {
    const exists = await this.minioClient.bucketExists(this.bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
    }
  }

  async uploadFile(file: Express.Multer.File, fileName: string) {
    const metaData = {
      'Content-Type': file.mimetype,
    };
    await this.minioClient.putObject(
      this.bucketName,
      fileName,
      file.buffer,
      file.size,
      metaData,
    );
    return fileName;
  }

  async getPresignedUrl(fileName: string, expiryInSeconds: number = 3600) {
    return await this.minioClient.presignedGetObject(this.bucketName, fileName, expiryInSeconds);
  }
}
