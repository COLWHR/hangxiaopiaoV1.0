import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Ticket } from './ticket.entity';

@Entity('ticket_stubs')
export class TicketStub {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', nullable: false })
  ticketId: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  qrCodeUrl: string;

  @CreateDateColumn({ type: 'date' })
  generatedAt: Date;

  @OneToOne(() => Ticket, ticket => ticket.ticketStub, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;
}