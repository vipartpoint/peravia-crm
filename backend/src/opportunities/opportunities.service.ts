import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { ActivitiesService } from '../activities/activities.service';

import { NotificationsCenterService } from '../notifications-center/notifications-center.service';

@Injectable()
export class OpportunitiesService {
  constructor(
    private prisma: PrismaService, 
    private activitiesService: ActivitiesService,
    private notificationsCenter: NotificationsCenterService
  ) {}

  async create(createOpportunityDto: CreateOpportunityDto, userId: string) {
    const { items, ...data } = createOpportunityDto;
    
    // Auto-calculate estimated value from items
    let totalEstimatedValue = 0;
    let totalPotentialVolume = 0;

    if (items && items.length > 0) {
      for (const item of items) {
        totalEstimatedValue += (item.quantity * (item.unitPrice || 0));
        totalPotentialVolume += (item.potentialVolume || 0);
      }
    }

    // Default probability lookup based on stage
    let probability = data.probability || 10;
    if (data.stage && !data.probability) {
      const stageConfig = await this.prisma.opportunityStageConfig.findUnique({
        where: { name: data.stage }
      });
      if (stageConfig) {
        probability = stageConfig.probability;
      }
    }

    const opportunity = await this.prisma.opportunity.create({
      data: {
        ...data,
        ownerId: data.ownerId || userId,
        createdBy: userId,
        probability,
        totalEstimatedValue,
        totalPotentialVolume,
        items: items ? {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            potentialVolume: item.potentialVolume || 0,
            unitPrice: item.unitPrice || 0,
            estimatedValue: item.quantity * (item.unitPrice || 0)
          }))
        } : undefined,
      },
      include: { items: true, customer: true, owner: true }
    });

    // Log creation
    await this.prisma.auditLog.create({
      data: {
        userId: userId !== 'system-user' ? userId : null,
        action: 'OPPORTUNITY_CREATED',
        entityType: 'Opportunity',
        entityId: opportunity.id,
        newValue: { name: opportunity.name, stage: opportunity.salesStage }
      }
    });

    // Stage History
    await this.prisma.opportunityStageHistory.create({
      data: {
        opportunityId: opportunity.id,
        stage: opportunity.salesStage,
        changedBy: userId,
      }
    });

    await this.activitiesService.logActivity({
      entityType: 'Opportunity',
      entityId: opportunity.id,
      activityType: 'Created',
      title: 'ایجاد فرصت فروش',
      description: `فرصت فروش جدید با نام ${opportunity.name} ثبت شد.`
    }, userId);

    return opportunity;
  }

  async findAll(filters: any) {
    return this.prisma.opportunity.findMany({
      where: filters,
      include: {
        customer: true,
        owner: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const opp = await this.prisma.opportunity.findUnique({
      where: { id },
      include: {
        customer: true,
        owner: true,
        territory: true,
        items: { include: { product: true } },
        stageHistory: { include: { user: true } }
      }
    });
    if (!opp) throw new NotFoundException('Opportunity not found');
    return opp;
  }

  async update(id: string, data: UpdateOpportunityDto, userId: string) {
    const existing = await this.prisma.opportunity.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('فرصت یافت نشد');

    const VALID_STAGES = ['Suspect', 'Prospect', 'Analysis', 'Negotiate', 'Close', 'Order', 'Payment'];
    
    // Ensure salesStage is valid if provided
    if (data.salesStage && !VALID_STAGES.includes(data.salesStage)) {
      throw new BadRequestException('مرحله فروش نامعتبر است');
    }

    // Determine effective salesStage and status
    let newSalesStage = data.salesStage || existing.salesStage;
    let newStatus = data.status || existing.status;

    // Payment validation rules
    const isTransitioningToPayment = data.salesStage === 'Payment' && existing.salesStage !== 'Payment';
    const isManuallySettingWon = data.status === 'Won' && existing.status !== 'Won';

    if (isTransitioningToPayment || isManuallySettingWon) {
      // Equivalent business validation: verify existence of a valid payment transaction for this specific Opportunity
      const validPayment = await this.prisma.payment.findFirst({
        where: { 
          status: 'Confirmed',
          OR: [
            { opportunityId: existing.id },
            { order: { opportunityId: existing.id } }
          ]
        }
      });

      if (!validPayment) {
        throw new ConflictException('Payment validation failed: A confirmed payment transaction is required.');
      }

      if (isTransitioningToPayment) {
        newStatus = 'Won';
      }
    }

    // Enforce Won status constraint
    if (newStatus === 'Won' && newSalesStage !== 'Payment') {
      throw new ConflictException('Manual Won assignment rejected: status can only be Won in the Payment stage.');
    }

    const { items, ...restData } = data;

    // Track stage change history (for salesStage, not legacy stage)
    if (data.salesStage && data.salesStage !== existing.salesStage) {
      const lastHistory = await this.prisma.opportunityStageHistory.findFirst({
        where: { opportunityId: id, leftAt: null },
        orderBy: { enteredAt: 'desc' }
      });

      if (lastHistory) {
        const duration = (new Date().getTime() - lastHistory.enteredAt.getTime()) / (1000 * 3600 * 24);
        await this.prisma.opportunityStageHistory.update({
          where: { id: lastHistory.id },
          data: { leftAt: new Date(), durationDays: duration }
        });
      }

      // Open new stage (saving salesStage into stage column of StageHistory for compatibility)
      await this.prisma.opportunityStageHistory.create({
        data: {
          opportunityId: id,
          stage: data.salesStage,
          changedBy: userId !== 'system-user' ? userId : existing.ownerId
        }
      });
      
      await this.activitiesService.logActivity({
        entityType: 'Opportunity',
        entityId: id,
        activityType: 'StageChanged',
        title: 'تغییر مرحله فرصت فروش',
        description: `مرحله فرصت به ${data.salesStage} تغییر یافت.`
      }, userId);
    }

    // Update items if provided (simplified full replace)
    let finalData: any = { ...restData, status: newStatus, salesStage: newSalesStage };
    
    // Handle Lost/Reopen Transitions
    if (newStatus === 'Lost' && existing.status !== 'Lost') {
      if (!data.lostReasonId) {
        throw new BadRequestException('انتخاب دلیل از دست رفتن فرصت (lostReasonId) الزامی است.');
      }
      finalData.lostAt = new Date();
      finalData.lostById = userId;
    } else if (newStatus === 'Open' && existing.status === 'Lost') {
      if (!data.reopenReasonId) {
        throw new BadRequestException('انتخاب دلیل بازگشایی فرصت (reopenReasonId) الزامی است.');
      }
      finalData.reopenedAt = new Date();
      finalData.reopenedById = userId;
    }

    if (items) {
      await this.prisma.opportunityItem.deleteMany({ where: { opportunityId: id } });
      
      let totalEstimatedValue = 0;
      let totalPotentialVolume = 0;
      for (const item of items) {
        totalEstimatedValue += (item.quantity * (item.unitPrice || 0));
        totalPotentialVolume += (item.potentialVolume || 0);
      }
      
      finalData.totalEstimatedValue = totalEstimatedValue;
      finalData.totalPotentialVolume = totalPotentialVolume;
    }

    if (data.competitors) {
      delete finalData.competitors;
      await this.prisma.opportunityCompetitor.deleteMany({ where: { opportunityId: id } });
      if (data.competitors.length > 0) {
        await this.prisma.opportunityCompetitor.createMany({
          data: data.competitors.map(c => ({
            opportunityId: id,
            competitorId: c.competitorId,
            isPrimary: c.isPrimary || false,
            note: c.note
          }))
        });
      }
    }

    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: {
        ...finalData,
        items: items ? {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            potentialVolume: item.potentialVolume || 0,
            unitPrice: item.unitPrice || 0,
            estimatedValue: item.quantity * (item.unitPrice || 0)
          }))
        } : undefined
      },
      include: { items: true, customer: true }
    });

    // Log update
    await this.prisma.auditLog.create({
      data: {
        userId: userId !== 'system-user' ? userId : null,
        action: data.salesStage !== existing.salesStage ? 'OPPORTUNITY_STAGE_CHANGED' : (data.status === 'Won' ? 'OPPORTUNITY_WON' : 'OPPORTUNITY_UPDATED'),
        entityType: 'Opportunity',
        entityId: id,
        oldValue: { stage: existing.salesStage, status: existing.status },
        newValue: { stage: updated.salesStage, status: updated.status }
      }
    });

    if (newStatus === 'Won' && existing.status !== 'Won') {
      await this.activitiesService.logActivity({
        entityType: 'Opportunity',
        entityId: id,
        activityType: 'OpportunityWon',
        title: 'موفقیت فرصت فروش',
        description: `فرصت فروش با موفقیت بسته شد!`
      }, userId);

      await this.notificationsCenter.createNotification({
        userId: updated.ownerId,
        title: 'فرصت فروش موفق',
        message: `فرصت فروش ${updated.name} با موفقیت در مرحله Payment بسته شد.`,
        type: 'Alert',
        priority: 'Low',
        entityType: 'Opportunity',
        entityId: id,
        actionUrl: `/opportunities/dashboard`
      });
    } else if (newStatus === 'Lost' && existing.status !== 'Lost') {
      const lr = await this.prisma.lostReason.findUnique({ where: { id: data.lostReasonId } });
      const lrName = lr ? lr.nameFa : 'نامشخص';
      await this.activitiesService.logActivity({
        entityType: 'Opportunity',
        entityId: id,
        activityType: 'OpportunityLost',
        title: 'شکست فرصت فروش',
        description: `فرصت فروش در مرحله ${updated.salesStage} به دلیل ${lrName} شکست خورد.`,
        metadata: {
          lostReasonId: lr?.id,
          lostReasonCode: lr?.code,
          competitorIds: data.competitors?.map(c => c.competitorId) || []
        }
      }, userId);

      await this.notificationsCenter.createNotification({
        userId: updated.ownerId,
        title: 'فرصت فروش از دست رفت',
        message: `فرصت فروش ${updated.name} شکست خورد. دلیل: ${lrName}`,
        type: 'Alert',
        priority: 'Medium',
        entityType: 'Opportunity',
        entityId: id,
        actionUrl: `/opportunities/dashboard`
      });
    } else if (newStatus === 'Open' && existing.status === 'Lost') {
      const rr = await this.prisma.reopenReason.findUnique({ where: { id: data.reopenReasonId } });
      const rrName = rr ? rr.nameFa : 'نامشخص';
      await this.activitiesService.logActivity({
        entityType: 'Opportunity',
        entityId: id,
        activityType: 'OpportunityReopened',
        title: 'بازگشایی مجدد فرصت فروش',
        description: `فرصت فروش مجدداً بازگشایی شد. دلیل: ${rrName}`,
        metadata: {
          reopenReasonId: rr?.id,
          reopenReasonCode: rr?.code
        }
      }, userId);
    }

    return updated;
  }

  async getDashboardForecast(filters: any) {
    const opportunities = await this.prisma.opportunity.findMany({ 
      where: filters,
      include: { items: { include: { product: true } } }
    });
    
    let pipelineValue = 0;
    let weightedForecast = 0;
    
    let openCount = 0;
    let won = 0;
    let lost = 0;
    
    const byStage: Record<string, { count: number, value: number }> = {};
    const productDemand: Record<string, { volume: number, weightedVolume: number }> = {};
    const lostReasons: Record<string, number> = {};

    opportunities.forEach(opp => {
      const value = Number(opp.totalEstimatedValue || 0);
      const prob = opp.probability || 0;
      
      // Stage stats
      if (!byStage[opp.stage]) byStage[opp.stage] = { count: 0, value: 0 };
      byStage[opp.stage].count++;
      byStage[opp.stage].value += value;
      
      // Funnel & KPI stats
      if (opp.status === 'Open') {
        openCount++;
        pipelineValue += value;
        weightedForecast += (value * (prob / 100));
        
        // Product Demand (only for open opportunities)
        if (opp.items) {
          opp.items.forEach(item => {
            const prodName = item.product?.name || `Product ${item.productId}`;
            const volume = Number(item.potentialVolume || 0) || Number(item.quantity || 0);
            if (!productDemand[prodName]) productDemand[prodName] = { volume: 0, weightedVolume: 0 };
            productDemand[prodName].volume += volume;
            productDemand[prodName].weightedVolume += (volume * (prob / 100));
          });
        }
      } else if (opp.status === 'Won') {
        won++;
      } else if (opp.status === 'Lost') {
        lost++;
        if (opp.lostReason) {
          lostReasons[opp.lostReason] = (lostReasons[opp.lostReason] || 0) + 1;
        }
      }
    });

    return {
      pipelineValue,
      weightedForecast,
      winLoss: {
        won,
        lost,
        totalClosed: won + lost,
        lostReasons
      },
      openCount,
      byStage,
      productDemand
    };
  }

  async convertToOrderPreview(id: string) {
    const opp = await this.findOne(id);
    if (!opp) throw new NotFoundException('Opportunity not found');

    return {
      customerId: opp.customerId,
      userId: opp.ownerId,
      territoryId: opp.territoryId,
      items: opp.items.map(i => ({
        productId: i.productId,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountPercent: 0,
        finalUnitPrice: i.unitPrice,
        totalPrice: Number(i.quantity) * Number(i.unitPrice)
      }))
    };
  }

  async generateCustomReport(body: any, baseFilters: any) {
    const where: any = { ...baseFilters };

    // Apply dynamic filters
    if (body.dateRange?.start && body.dateRange?.end) {
      where.createdAt = { gte: new Date(body.dateRange.start), lte: new Date(body.dateRange.end) };
    }
    if (body.salespersonId) where.ownerId = body.salespersonId;
    if (body.territoryId) where.territoryId = body.territoryId;
    if (body.customerId) where.customerId = body.customerId;
    if (body.stage) where.stage = body.stage;
    if (body.status) where.status = body.status;
    if (body.competitor) where.competitorName = body.competitor;
    if (body.lostReason) where.lostReason = body.lostReason;
    
    if (body.probabilityRange && body.probabilityRange.length === 2) {
      where.probability = { gte: body.probabilityRange[0], lte: body.probabilityRange[1] };
    }
    if (body.estimatedValueRange && body.estimatedValueRange.length === 2) {
      where.totalEstimatedValue = { gte: body.estimatedValueRange[0], lte: body.estimatedValueRange[1] };
    }
    if (body.potentialVolumeRange && body.potentialVolumeRange.length === 2) {
      where.totalPotentialVolume = { gte: body.potentialVolumeRange[0], lte: body.potentialVolumeRange[1] };
    }
    
    // If productId is filtered, we must find opportunities that have this product
    if (body.productId) {
      where.items = { some: { productId: body.productId } };
    }

    const opportunities = await this.prisma.opportunity.findMany({
      where,
      include: {
        customer: true,
        owner: true,
        territory: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    let pipelineValue = 0;
    let weightedForecast = 0;
    let potentialVolume = 0;
    let weightedVolume = 0;
    let wonCount = 0;
    let wonValue = 0;
    let lostCount = 0;
    let totalSalesCycleDays = 0;
    
    // Grouping map
    const groups: Record<string, { name: string, count: number, value: number }> = {};
    const getGroupKey = (opp: any): string | string[] => {
      switch (body.groupBy) {
        case 'Stage': return opp.stage || 'نامشخص';
        case 'Month': return opp.createdAt.toISOString().slice(0, 7); // YYYY-MM
        case 'Salesperson': return opp.owner?.username || opp.owner?.firstName || 'نامشخص';
        case 'Territory': return opp.territory?.name || 'نامشخص';
        case 'Customer': return opp.customer?.name || 'نامشخص';
        case 'Competitor': return opp.competitorName || 'ندارد';
        case 'LostReason': return opp.lostReason || 'نامشخص';
        case 'Product': 
          if (!opp.items || opp.items.length === 0) return 'بدون محصول';
          return opp.items.map((i: any) => i.product?.name || `Product ${i.productId}`);
        default: return opp.stage || 'نامشخص';
      }
    };

    opportunities.forEach(opp => {
      const value = Number(opp.totalEstimatedValue || 0);
      const vol = Number(opp.totalPotentialVolume || 0);
      const prob = opp.probability || 0;

      // KPIs
      pipelineValue += value;
      weightedForecast += (value * (prob / 100));
      potentialVolume += vol;
      weightedVolume += (vol * (prob / 100));

      if (opp.status === 'Won') {
        wonCount++;
        wonValue += value;
        // Sales cycle calculation (Days between created and updated, assuming won at updated)
        const days = (opp.updatedAt.getTime() - opp.createdAt.getTime()) / (1000 * 3600 * 24);
        totalSalesCycleDays += days;
      } else if (opp.status === 'Lost') {
        lostCount++;
      }

      // Grouping
      const keys = getGroupKey(opp);
      const keyArray = Array.isArray(keys) ? keys : [keys];
      
      keyArray.forEach(k => {
        if (!groups[k]) groups[k] = { name: k, count: 0, value: 0 };
        // If grouped by product, we should ideally sum only that product's value. 
        // For simplicity, we add the opportunity's total value or count it.
        groups[k].count++;
        groups[k].value += (Array.isArray(keys) && keys.length > 1) ? (value / keys.length) : value; 
      });
    });

    const totalClosed = wonCount + lostCount;
    const winRate = totalClosed > 0 ? (wonCount / totalClosed) * 100 : 0;
    const lossRate = totalClosed > 0 ? (lostCount / totalClosed) * 100 : 0;
    const avgDealSize = wonCount > 0 ? (wonValue / wonCount) : 0;
    const avgSalesCycle = wonCount > 0 ? (totalSalesCycleDays / wonCount) : 0;

    const chartData = Object.values(groups).sort((a, b) => b.value - a.value);

    return {
      kpis: {
        totalPipelineValue: pipelineValue,
        weightedForecast,
        potentialVolume,
        weightedVolume,
        opportunityCount: opportunities.length,
        winRate: winRate.toFixed(2),
        lossRate: lossRate.toFixed(2),
        avgDealSize,
        avgSalesCycle: avgSalesCycle.toFixed(1)
      },
      chartData,
      rawData: opportunities.map(o => ({
        id: o.id,
        name: o.name,
        stage: o.stage,
        status: o.status,
        probability: o.probability,
        value: Number(o.totalEstimatedValue || 0),
        volume: Number(o.totalPotentialVolume || 0),
        customer: o.customer?.name,
        owner: o.owner?.username || o.owner?.email,
        territory: o.territory?.name,
        createdAt: o.createdAt
      }))
    };
  }
}
