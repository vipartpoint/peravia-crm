import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async getActiveSessions(userId?: string) {
    let whereClause: any = { isValid: true };
    if (userId) {
      whereClause.userId = userId;
    }
    
    return this.prisma.activeSession.findMany({
      where: whereClause,
      include: { user: { select: { username: true, role: { select: { name: true } } } } },
      orderBy: { lastActivity: 'desc' }
    });
  }

  async revokeSession(id: string, currentUser: any) {
    const session = await this.prisma.activeSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');

    await this.prisma.activeSession.update({
      where: { id },
      data: { isValid: false, revokedAt: new Date() }
    });

    await this.prisma.auditLog.create({
      data: { userId: currentUser.id, action: 'SESSION_REVOKED', entityType: 'Session', entityId: id }
    });

    return { message: 'Session revoked successfully' };
  }

  async revokeAllUserSessions(userId: string, currentUser: any) {
    await this.prisma.activeSession.updateMany({
      where: { userId, isValid: true },
      data: { isValid: false, revokedAt: new Date() }
    });

    await this.prisma.auditLog.create({
      data: { userId: currentUser.id, action: 'SESSION_REVOKED', entityType: 'User', entityId: userId }
    });

    return { message: 'All sessions revoked' };
  }

  async getSecurityDashboard() {
    const failedLogins = await this.prisma.user.findMany({
      where: { failedLogins: { gt: 0 } },
      select: { id: true, username: true, failedLogins: true, isLocked: true }
    });

    const activeSessionsCount = await this.prisma.activeSession.count({ where: { isValid: true } });

    const recentAudits = await this.prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true } } }
    });

    return {
      failedLogins,
      activeSessionsCount,
      recentAudits
    };
  }
}
