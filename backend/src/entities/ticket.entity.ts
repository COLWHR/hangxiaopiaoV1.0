import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToOne } from 'typeorm';
import { Activity } from './activity.entity';
import { User } from './user.entity';
import { TicketStub } from './ticket-stub.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', nullable: false })
  activityId: number;

  @Column({ type: 'integer', nullable: false })
  userId: number;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  ticketNumber: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  seatNumber: string;

  @Column({ type: 'varchar', length: 20, default: 'valid' })
  status: string;

  @CreateDateColumn({ type: 'date' })
  createdAt: Date;

  @ManyToOne(() => Activity, activity => activity.tickets)
  activity: Activity;

  @ManyToOne(() => User, user => user.tickets)
  user: User;

  @OneToOne(() => TicketStub, ticketStub => ticketStub.ticket, { cascade: true })
  ticketStub: TicketStub;
}