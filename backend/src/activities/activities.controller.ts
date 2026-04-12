import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { Activity } from '../entities/activity.entity';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  create(@Body() activityData: Partial<Activity>): Promise<Activity> {
    return this.activitiesService.create(activityData);
  }

  @Get()
  findAll(): Promise<Activity[]> {
    return this.activitiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Activity> {
    return this.activitiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() activityData: Partial<Activity>): Promise<Activity> {
    return this.activitiesService.update(id, activityData);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.activitiesService.remove(id);
  }

  @Get(':id/tickets')
  getActivityWithTickets(@Param('id') id: number): Promise<Activity> {
    return this.activitiesService.getActivityWithTickets(id);
  }
}
