import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
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
  findAll(
    @Query('adminAccountId') adminAccountId?: string,
    @Query('adminUserId') adminUserId?: string,
  ): Promise<Activity[]> {
    return this.activitiesService.findAll({
      adminAccountId,
      adminUserId,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Activity> {
    return this.activitiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() activityData: Partial<Activity>): Promise<Activity> {
    return this.activitiesService.update(id, activityData);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.activitiesService.remove(id);
  }

  @Get(':id/tickets')
  getActivityWithTickets(@Param('id', ParseIntPipe) id: number): Promise<Activity> {
    return this.activitiesService.getActivityWithTickets(id);
  }
}
