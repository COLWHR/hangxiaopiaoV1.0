import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ActivitiesModule } from './activities/activities.module';
import { TicketsModule } from './tickets/tickets.module';
import { Activity } from './entities/activity.entity';
import { User } from './entities/user.entity';
import { Ticket } from './entities/ticket.entity';
import { TicketStub } from './entities/ticket-stub.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [Activity, User, Ticket, TicketStub],
      synchronize: true,
      logging: true,
    }),
    ActivitiesModule,
    TicketsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
