import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { ActivitiesModule } from './activities/activities.module';
import { AdminModule } from './admin/admin.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';
import { Activity } from './entities/activity.entity';
import { AdminActivityDraft } from './entities/admin-activity-draft.entity';
import { AdminAccount } from './entities/admin-account.entity';
import { Ticket } from './entities/ticket.entity';
import { TicketStub } from './entities/ticket-stub.entity';
import { User } from './entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.db',
      entities: [Activity, AdminAccount, AdminActivityDraft, User, Ticket, TicketStub],
      synchronize: true,
      logging: true,
    }),
    ActivitiesModule,
    AdminModule,
    TicketsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
