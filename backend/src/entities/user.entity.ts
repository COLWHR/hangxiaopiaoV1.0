import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Ticket } from './ticket.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  openid: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nickname: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  avatarUrl: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  studentId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  @CreateDateColumn({ type: 'date' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'date' })
  updatedAt: Date;

  @OneToMany(() => Ticket, ticket => ticket.user)
  tickets: Ticket[];
}