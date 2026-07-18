import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  generateStrongPassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let pass = '';
    for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    return pass;
  }

  async create(data: any) {
    const existing = await this.prisma.user.findUnique({ where: { username: data.username } });
    if (existing) throw new ConflictException('Username already exists');
    
    const randomPassword = this.generateStrongPassword();
    const passwordHash = await bcrypt.hash(randomPassword, 10);
    
    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        roleId: data.roleId,
        territoryId: data.territoryId,
        isActive: true,
        mustChangePassword: true,
      },
      select: { id: true, username: true, role: true, mfaEnabled: true, isActive: true },
    });
    
    return { ...user, generatedPassword: randomPassword };
  }

  async update(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        roleId: data.roleId,
        territoryId: data.territoryId,
      },
      select: { id: true, username: true, role: true, mfaEnabled: true, isActive: true }
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, username: true, isActive: true }
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username, deletedAt: null },
      include: { role: true },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        username: true,
        email: true,
        mfaEnabled: true,
        isActive: true,
        roleId: true,
        territoryId: true,
        createdAt: true,
        role: true,
        mustChangePassword: true,
      }
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
  
  async updateMfaSecret(userId: string, secret: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecretEncrypted: secret },
    });
  }

  async enableMfa(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true, mfaEnabledAt: new Date() },
    });
  }

  async getRoles() {
    return this.prisma.role.findMany({ select: { id: true, name: true } });
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        username: true,
        email: true,
        isActive: true,
        role: { select: { id: true, name: true } },
        territory: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: { username: 'asc' },
    });
  }
}
