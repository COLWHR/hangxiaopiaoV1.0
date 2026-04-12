import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../entities/activity.entity';
import * as qrcode from 'qrcode';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private activitiesRepository: Repository<Activity>,
  ) {}

  async create(activityData: Partial<Activity>): Promise<Activity> {
    const activity = this.activitiesRepository.create(activityData);
    activity.availableTickets = activity.totalTickets;
    
    // 生成活动二维码
    const qrCodeData = `https://miniprogram.com/activity/${activity.id}`;
    const qrCodeUrl = await qrcode.toDataURL(qrCodeData);
    activity.qrCodeUrl = qrCodeUrl;
    
    return this.activitiesRepository.save(activity);
  }

  async findAll(): Promise<Activity[]> {
    return this.activitiesRepository.find();
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
    Object.assign(activity, activityData);
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
