import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('admin_activity_drafts')
export class AdminActivityDraft {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true, nullable: false })
  adminAccountId: string;

  @Column({ type: 'varchar', length: 64, unique: true, nullable: false })
  adminUserId: string;

  @Column({ type: 'simple-json', nullable: true })
  draftData: Record<string, unknown> | null;

  @Column({ type: 'datetime', nullable: true })
  lastClearedAt: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
