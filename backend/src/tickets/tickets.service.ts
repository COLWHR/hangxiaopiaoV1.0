import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { TicketStub } from '../entities/ticket-stub.entity';
import { Activity } from '../entities/activity.entity';
import { User } from '../entities/user.entity';
import { ActivitiesService } from '../activities/activities.service';
import * as qrcode from 'qrcode';
import * as Redis from 'redis';
import * as amqp from 'amqplib';

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
  ) {
    try {
      // 初始化Redis客户端
      this.redisClient = Redis.createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        password: process.env.REDIS_PASSWORD,
      });
      this.redisClient.connect().catch((error) => {
        console.error('Failed to connect to Redis:', error);
        this.redisClient = null;
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.redisClient = null;
    }

    // 初始化RabbitMQ连接
    this.initRabbitMQ();
  }

  private async initRabbitMQ() {
    try {
      const connection = await amqp.connect({
        hostname: process.env.RABBITMQ_HOST,
        port: parseInt(process.env.RABBITMQ_PORT || '5672'),
        username: process.env.RABBITMQ_USERNAME,
        password: process.env.RABBITMQ_PASSWORD,
      });
      this.rabbitMQChannel = await connection.createChannel();
      await this.rabbitMQChannel.assertQueue('ticket_queue', { durable: true });
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
    }
  }

  async bookTicket(
    activityId: number,
    userId: number,
  ): Promise<Ticket> {
    return this.dataSource.transaction(async (manager) => {
    // 1. 检查活动是否存在
    const activity = await manager.findOne(Activity, {
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${activityId} not found`);
    }

    // 2. 检查活动状态
    const now = new Date();
    if (now < activity.startTime) {
      throw new ForbiddenException('Ticket booking has not started yet');
    }
    if (now > activity.endTime) {
      throw new ForbiddenException('Ticket booking has ended');
    }
    if (activity.status !== 'active') {
      throw new ForbiddenException('Activity is not active');
    }

    // 3. 检查剩余票数
    if (activity.availableTickets <= 0) {
      throw new BadRequestException('No tickets available');
    }

    // 4. 检查用户是否存在，如果不存在则创建
    let user = await manager.findOne(User, {
      where: { id: userId },
    });

    if (!user) {
      user = manager.create(User, {
        id: userId,
        openid: `openid_${userId}`,
        nickname: `User ${userId}`,
      });
      await manager.save(user);
    }

    // 5. 检查用户是否已经抢过票
    const existingTicket = await manager.findOne(Ticket, {
      where: { activityId, userId },
    });

    if (existingTicket) {
      throw new BadRequestException('You have already booked a ticket for this activity');
    }

    // 5. 生成门票编号和座位号
    const ticketNumber = `T${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const seatNumber = `${Math.floor(Math.random() * 100) + 1}`;

    // 6. 创建门票
    const ticket = manager.create(Ticket, {
      activityId,
      userId,
      ticketNumber,
      seatNumber,
      status: 'valid',
    });

    // 7. 减少剩余票数
    activity.availableTickets -= 1;
    await manager.save(activity);

    // 8. 保存门票
    await manager.save(ticket);

    // 9. 生成票根
    await this.generateTicketStub(ticket.id, manager);

    return ticket;
    });
  }

  private async generateTicketStub(ticketId: number, manager?: any) {
    const ticket = await (manager || this.ticketsRepository).findOne(Ticket, {
      where: { id: ticketId },
    });

    if (ticket) {
      const qrCodeData = `https://miniprogram.com/ticket/${ticket.ticketNumber}`;
      const qrCodeUrl = await qrcode.toDataURL(qrCodeData);

      const ticketStub = (manager || this.ticketStubsRepository).create(TicketStub, {
        ticketId,
        qrCodeUrl,
      });

      await (manager || this.ticketStubsRepository).save(ticketStub);
    }
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

  // 异步处理抢票请求（使用消息队列）
  async asyncBookTicket(activityId: number, userId: number): Promise<{ message: string }> {
    // 如果Redis或RabbitMQ不可用，降级为同步处理
    if (!this.redisClient || !this.rabbitMQChannel) {
      await this.bookTicket(activityId, userId);
      return { message: 'Ticket booked successfully' };
    }

    try {
      // 1. 检查Redis中是否已经抢过票
      const redisKey = `ticket:${activityId}:${userId}`;
      const hasBooked = await this.redisClient.get(redisKey);

      if (hasBooked) {
        throw new BadRequestException('You have already booked a ticket for this activity');
      }

      // 2. 检查活动状态和剩余票数（从Redis缓存）
      const activityKey = `activity:${activityId}`;
      const activityData = await this.redisClient.get(activityKey);

      if (!activityData) {
        // 从数据库获取活动信息并缓存
        const activity = await this.activitiesService.findOne(activityId);
        await this.redisClient.set(activityKey, JSON.stringify(activity), {
          EX: 3600, // 缓存1小时
        });
      }

      // 3. 发送消息到队列
      if (this.rabbitMQChannel) {
        const message = JSON.stringify({ activityId, userId });
        this.rabbitMQChannel.sendToQueue('ticket_queue', Buffer.from(message), {
          persistent: true,
        });
      }

      return { message: 'Booking request received, please wait for confirmation' };
    } catch (error) {
      // 出错时降级为同步处理
      await this.bookTicket(activityId, userId);
      return { message: 'Ticket booked successfully' };
    }
  }

  // 处理队列中的抢票请求
  async processBookingRequest(data: { activityId: number; userId: number }) {
    try {
      await this.bookTicket(data.activityId, data.userId);
      
      // 设置Redis标记
      if (this.redisClient) {
        const redisKey = `ticket:${data.activityId}:${data.userId}`;
        await this.redisClient.set(redisKey, '1', {
          EX: 86400, // 缓存24小时
        }).catch((error) => {
          console.error('Failed to set Redis key:', error);
        });
      }
    } catch (error) {
      console.error('Error processing booking request:', error);
    }
  }
}
