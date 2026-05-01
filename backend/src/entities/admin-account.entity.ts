import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('admin_accounts')
export class AdminAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true, nullable: false })
  account: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  displayName: string;

  @Column({ type: 'varchar', length: 64, unique: true, nullable: false })
  adminAccountId: string;

  @Column({ type: 'varchar', length: 64, unique: true, nullable: false })
  adminUserId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  passwordHash: string;

  @CreateDateColumn({ type: 'date' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'date' })
  updatedAt: Date;
}
