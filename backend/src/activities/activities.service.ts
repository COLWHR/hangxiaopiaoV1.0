import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as qrcode from 'qrcode';
import { Activity } from '../entities/activity.entity';

const DEFAULT_ACTIVITY_COVER_URL =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=campus%20event%20banner%20sports%20festival%20concert%20lecture%20bright%20professional&image_size=landscape_16_9';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private activitiesRepository: Repository<Activity>,
  ) {}

  private getSoldTickets(activity: Pick<Activity, 'totalTickets' | 'availableTickets'>): number {
    const totalTickets = Number(activity.totalTickets ?? 0);
    const availableTickets = Number(activity.availableTickets ?? totalTickets);
    return Math.max(totalTickets - availableTickets, 0);
  }

  private normalizeActivityData(
    activityData: Partial<Activity>,
    currentActivity?: Activity,
  ): Partial<Activity> {
    const totalTickets = Number(activityData.totalTickets ?? 0);
    const normalizedTotalTickets = Number.isFinite(totalTickets) && totalTickets > 0 ? Math.floor(totalTickets) : 0;
    const availableTicketsValue = activityData.availableTickets;
    const availableTickets =
      availableTicketsValue === undefined || availableTicketsValue === null
        ? currentActivity
          ? Math.max(normalizedTotalTickets - this.getSoldTickets(currentActivity), 0)
          : normalizedTotalTickets
        : Number(availableTicketsValue);

    return {
      ...activityData,
      title: (activityData.title ?? '').trim(),
      description: (activityData.description ?? (activityData as { summary?: string }).summary ?? '').trim(),
      location: (activityData.location ?? '').trim() || null,
      coverImageUrl: (activityData.coverImageUrl ?? (activityData as { coverImage?: string }).coverImage ?? '')
        .trim() || DEFAULT_ACTIVITY_COVER_URL,
      galleryImageUrl: (activityData.galleryImageUrl ?? (activityData as { galleryImage?: string }).galleryImage ?? '')
        .trim() || null,
      ticketStubImageUrl: (
        activityData.ticketStubImageUrl ?? (activityData as { ticketStubImage?: string }).ticketStubImage ?? ''
      ).trim() || null,
      ticketStubSlogan: (activityData.ticketStubSlogan ?? '').trim() || null,
      ticketNumberPrefix: (activityData.ticketNumberPrefix ?? '').trim() || null,
      seatRule: (activityData.seatRule ?? '').trim() || null,
      registrationFields: Array.isArray(activityData.registrationFields) ? activityData.registrationFields : null,
      adminAccountId: (activityData.adminAccountId ?? '').trim() || null,
      adminUserId: (activityData.adminUserId ?? '').trim() || null,
      status: (activityData.status ?? 'published').trim() || 'published',
      totalTickets: normalizedTotalTickets,
      availableTickets: Number.isFinite(availableTickets) && availableTickets >= 0
        ? Math.min(Math.floor(availableTickets), normalizedTotalTickets)
        : normalizedTotalTickets,
    };
  }

  async create(activityData: Partial<Activity>): Promise<Activity> {
    const normalized = this.normalizeActivityData(activityData);
    const activity = this.activitiesRepository.create(normalized);

    if (activity.availableTickets === undefined || activity.availableTickets === null) {
      activity.availableTickets = activity.totalTickets ?? 0;
    }

    const savedActivity = await this.activitiesRepository.save(activity);
    const qrCodeData = `https://miniprogram.com/activity/${savedActivity.id}`;
    savedActivity.qrCodeUrl = await qrcode.toDataURL(qrCodeData);

    return this.activitiesRepository.save(savedActivity);
  }

  async findAll(filters: { adminAccountId?: string; adminUserId?: string } = {}): Promise<Activity[]> {
    const where: Record<string, string> = {};
    if (filters.adminAccountId) {
      where.adminAccountId = filters.adminAccountId;
    }
    if (filters.adminUserId) {
      where.adminUserId = filters.adminUserId;
    }

    return this.activitiesRepository.find({
      where: Object.keys(where).length ? (where as any) : undefined,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<Activity> {
    const activity = await this.activitiesRepository.findOne({ where: { id } });
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }
    return activity;
  }

  async update(id: number, activityData: Partial<Activity>): Promise<Activity> {
    const activity = await this.findOne(id);
    const hasAvailableTickets = Object.prototype.hasOwnProperty.call(activityData, 'availableTickets');
    const normalized = this.normalizeActivityData({
      ...activity,
      ...activityData,
      availableTickets: hasAvailableTickets ? activityData.availableTickets : undefined,
    }, activity);

    Object.assign(activity, normalized);

    if (activity.availableTickets === undefined || activity.availableTickets === null) {
      activity.availableTickets = Math.max(activity.totalTickets - this.getSoldTickets(activity), 0);
    }

    return this.activitiesRepository.save(activity);
  }

  async remove(id: number): Promise<void> {
    const activity = await this.findOne(id);
    await this.activitiesRepository.remove(activity);
  }

  async getActivityWithTickets(id: number): Promise<Activity> {
    const activity = await this.activitiesRepository.findOne({
      where: { id },
      relations: ['tickets'],
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    return activity;
  }
}
