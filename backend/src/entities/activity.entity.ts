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

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  coverImageUrl: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  galleryImageUrl: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  ticketStubImageUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ticketStubSlogan: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  ticketNumberPrefix: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  seatRule: string | null;

  @Column({ type: 'simple-json', nullable: true })
  registrationFields: Record<string, unknown>[] | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  adminAccountId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  adminUserId: string | null;

  @Column({ type: 'integer', nullable: false })
  totalTickets: number;

  @Column({ type: 'integer', nullable: false })
  availableTickets: number;

  @Column({ type: 'datetime', nullable: false })
  startTime: Date;

  @Column({ type: 'datetime', nullable: false })
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
