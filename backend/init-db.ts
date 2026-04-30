import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Activity } from './src/entities/activity.entity';
import { TicketStub } from './src/entities/ticket-stub.entity';
import { Ticket } from './src/entities/ticket.entity';
import { User } from './src/entities/user.entity';

const dataSource = new DataSource({
  type: 'sqlite',
  database: 'database.db',
  entities: [Activity, User, Ticket, TicketStub],
  synchronize: true,
  dropSchema: true,
  logging: false,
});

async function main() {
  console.log('正在创建数据库...');
  await dataSource.initialize();
  console.log('数据库创建完成：database.db');
  await dataSource.destroy();
}

main().catch((error) => {
  console.error('数据库创建失败：', error);
  process.exit(1);
});
