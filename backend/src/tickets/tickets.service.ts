import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { TicketStub } from '../entities/ticket-stub.entity';
import { Activity } from '../entities/activity.entity';
import { User } from '../entities/user.entity';
import { ActivitiesService } from '../activities/activities.service';
import * as qrcode from 'qrcode';
import * as Redis from 'redis';
import * as amqp from 'amqplib';

const BOOKABLE_ACTIVITY_STATUSES = new Set(['active', 'published']);

@Injectable()
export class TicketsService {
  private redisClient: Redis.RedisClientType | null = null;
  private rabbitMQChannel: amqp.Channel | null = null;

  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    @InjectRepository(TicketStub)
    private ticketStubsRepository: Repository<TicketStub>,
    private activitiesService: ActivitiesService,
    private dataSource: DataSource,
  ) {}

  private async getRedisClient(): Promise<Redis.RedisClientType | null> {
    if (this.redisClient) {
      return this.redisClient;
    }

    if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
      return null;
    }

    try {
      this.redisClient = Redis.createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        password: process.env.REDIS_PASSWORD,
      });
      await this.redisClient.connect();
      return this.redisClient;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.redisClient = null;
      return null;
    }
  }

  private async getRabbitMQChannel(): Promise<amqp.Channel | null> {
    if (this.rabbitMQChannel) {
      return this.rabbitMQChannel;
    }

    if (!process.env.RABBITMQ_HOST) {
      return null;
    }

    try {
      const connection = await amqp.connect({
        hostname: process.env.RABBITMQ_HOST,
        port: parseInt(process.env.RABBITMQ_PORT || '5672', 10),
        username: process.env.RABBITMQ_USERNAME,
        password: process.env.RABBITMQ_PASSWORD,
      });
      this.rabbitMQChannel = await connection.createChannel();
      await this.rabbitMQChannel.assertQueue('ticket_queue', { durable: true });
      return this.rabbitMQChannel;
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      this.rabbitMQChannel = null;
      return null;
    }
  }

  async bookTicket(activityId: number, userId: number): Promise<Ticket> {
    return this.dataSource.transaction(async (manager) => {
      const activity = await manager.findOne(Activity, {
        where: { id: activityId },
      });

      if (!activity) {
        throw new NotFoundException(`Activity with ID ${activityId} not found`);
      }

      const now = new Date();
      const startTime = new Date(activity.startTime);
      const endTime = new Date(activity.endTime);

      if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
        throw new BadRequestException('Activity time is invalid');
      }

      if (now < startTime) {
        throw new ForbiddenException('Ticket booking has not started yet');
      }
      if (now > endTime) {
        throw new ForbiddenException('Ticket booking has ended');
      }
      if (!BOOKABLE_ACTIVITY_STATUSES.has(activity.status)) {
        throw new ForbiddenException('Activity is not active');
      }

      if (activity.availableTickets <= 0) {
        throw new BadRequestException('No tickets available');
      }

      const user = await manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Please log in and complete your profile first');
      }

      if (!user.profileCompleted) {
        throw new ForbiddenException('Please complete your profile first');
      }

      const existingTicket = await manager.findOne(Ticket, {
        where: { activityId, userId },
      });

      if (existingTicket) {
        throw new BadRequestException('You have already booked a ticket for this activity');
      }

      const ticketNumber = `T${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const seatNumber = `${Math.floor(Math.random() * 100) + 1}`;

      const ticket = manager.create(Ticket, {
        activityId,
        userId,
        ticketNumber,
        seatNumber,
        status: 'valid',
      });

      activity.availableTickets -= 1;
      await manager.save(activity);
      await manager.save(ticket);
      await this.generateTicketStub(ticket.id, manager);

      return ticket;
    });
  }

  private async generateTicketStub(ticketId: number, manager?: any) {
    const ticket = await (manager || this.ticketsRepository).findOne(Ticket, {
      where: { id: ticketId },
    });

    if (!ticket) {
      return;
    }

    const qrCodeData = `https://miniprogram.com/ticket/${ticket.ticketNumber}`;
    const qrCodeUrl = await qrcode.toDataURL(qrCodeData);

    const ticketStub = (manager || this.ticketStubsRepository).create(TicketStub, {
      ticketId,
      qrCodeUrl,
    });

    await (manager || this.ticketStubsRepository).save(ticketStub);
  }

  async getTicketByNumber(ticketNumber: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { ticketNumber },
      relations: ['activity', 'ticketStub'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with number ${ticketNumber} not found`);
    }

    return ticket;
  }

  async getUserTickets(userId: number): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      where: { userId },
      relations: ['activity', 'ticketStub'],
    });
  }

  async asyncBookTicket(activityId: number, userId: number): Promise<{ message: string }> {
    const redisClient = await this.getRedisClient();
    const rabbitMQChannel = await this.getRabbitMQChannel();

    if (!redisClient || !rabbitMQChannel) {
      await this.bookTicket(activityId, userId);
      return { message: 'Ticket booked successfully' };
    }

    try {
      const redisKey = `ticket:${activityId}:${userId}`;
      const hasBooked = await redisClient.get(redisKey);

      if (hasBooked) {
        throw new BadRequestException('You have already booked a ticket for this activity');
      }

      const activityKey = `activity:${activityId}`;
      const activityData = await redisClient.get(activityKey);

      if (!activityData) {
        const activity = await this.activitiesService.findOne(activityId);
        await redisClient.set(activityKey, JSON.stringify(activity), {
          EX: 3600,
        });
      }

      rabbitMQChannel.sendToQueue('ticket_queue', Buffer.from(JSON.stringify({ activityId, userId })), {
        persistent: true,
      });

      return { message: 'Booking request received, please wait for confirmation' };
    } catch (error) {
      await this.bookTicket(activityId, userId);
      return { message: 'Ticket booked successfully' };
    }
  }

  async processBookingRequest(data: { activityId: number; userId: number }) {
    try {
      await this.bookTicket(data.activityId, data.userId);

      const redisClient = await this.getRedisClient();
      if (redisClient) {
        const redisKey = `ticket:${data.activityId}:${data.userId}`;
        await redisClient
          .set(redisKey, '1', {
            EX: 86400,
          })
          .catch((error) => {
            console.error('Failed to set Redis key:', error);
          });
      }
    } catch (error) {
      console.error('Error processing booking request:', error);
    }
  }
}
