import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Ticket } from './ticket.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'integer', nullable: false })
  totalTickets: number;

  @Column({ type: 'integer', nullable: false })
  availableTickets: number;

  @Column({ type: 'date', nullable: false })
  startTime: Date;

  @Column({ type: 'date', nullable: false })
  endTime: Date;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  qrCodeUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Ticket, ticket => ticket.activity)
  tickets: Ticket[];
}