import { BadRequestException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, pbkdf2 as pbkdf2Callback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Repository } from 'typeorm';
import { AdminActivityDraft } from '../entities/admin-activity-draft.entity';
import { AdminAccount } from '../entities/admin-account.entity';

const PBKDF2_ITERATIONS = 120000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = 'sha256';
const pbkdf2Async = promisify(pbkdf2Callback);

const DEFAULT_ADMIN_ACCOUNTS = [
  {
    account: 'ADMIN2024',
    password: 'HXP-ADMIN',
    adminAccountId: 'admin-account-001',
    adminUserId: 'admin-user-001',
    displayName: '校团委活动管理员',
  },
];

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectRepository(AdminAccount)
    private adminAccountsRepository: Repository<AdminAccount>,
    @InjectRepository(AdminActivityDraft)
    private adminActivityDraftsRepository: Repository<AdminActivityDraft>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultAccounts();
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derived = await pbkdf2Async(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
    return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${derived.toString('hex')}`;
  }

  private async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    const parts = passwordHash.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
      return false;
    }

    const iterations = Number(parts[1]);
    const salt = parts[2];
    const stored = Buffer.from(parts[3], 'hex');
    const derived = await pbkdf2Async(password, salt, iterations, stored.length, PBKDF2_DIGEST);

    return timingSafeEqual(stored, derived as Buffer);
  }

  private sanitizeAccount(account: AdminAccount) {
    const { passwordHash, ...safeAccount } = account;
    return safeAccount;
  }

  private async seedDefaultAccounts(): Promise<void> {
    for (const seed of DEFAULT_ADMIN_ACCOUNTS) {
      const existing = await this.adminAccountsRepository.findOne({
        where: { account: seed.account },
      });

      if (existing) {
        continue;
      }

      const account = this.adminAccountsRepository.create({
        account: seed.account,
        displayName: seed.displayName,
        adminAccountId: seed.adminAccountId,
        adminUserId: seed.adminUserId,
        passwordHash: await this.hashPassword(seed.password),
      });
      await this.adminAccountsRepository.save(account);
    }
  }

  async login(account: string, password: string) {
    const normalizedAccount = (account ?? '').trim();
    const normalizedPassword = (password ?? '').trim();

    if (!normalizedAccount || !normalizedPassword) {
      throw new BadRequestException('账号和密码不能为空');
    }

    const adminAccount = await this.adminAccountsRepository.findOne({
      where: { account: normalizedAccount },
    });

    if (!adminAccount) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const matched = await this.verifyPassword(normalizedPassword, adminAccount.passwordHash);
    if (!matched) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const safeAccount = this.sanitizeAccount(adminAccount);
    return {
      success: true,
      data: {
        account: safeAccount.account,
        displayName: safeAccount.displayName,
        adminAccountId: safeAccount.adminAccountId,
        adminUserId: safeAccount.adminUserId,
        loggedInAt: new Date().toISOString(),
      },
    };
  }

  private normalizeDraftPayload(
    adminAccountId: string,
    adminUserId: string,
    draftData: Record<string, unknown>,
  ): Record<string, unknown> {
    const now = new Date().toISOString();
    const currentDraft = draftData && typeof draftData === 'object' ? draftData : {};
    const currentDraftData = currentDraft as { createdAt?: string; updatedAt?: string };
    return {
      ...currentDraft,
      adminAccountId,
      adminUserId,
      createdAt: currentDraftData.createdAt || currentDraftData.updatedAt || now,
      updatedAt: currentDraftData.updatedAt || now,
    };
  }

  private getDraftTimestamp(draftData: Record<string, unknown> | null | undefined): number {
    if (!draftData || typeof draftData !== 'object') {
      return 0;
    }

    const timestamp = new Date(
      String((draftData as { updatedAt?: string }).updatedAt || (draftData as { createdAt?: string }).createdAt || 0),
    ).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private getDateTimestamp(dateValue: Date | string | null | undefined): number {
    if (!dateValue) {
      return 0;
    }

    const timestamp = new Date(dateValue).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  async getDraft(adminAccountId: string, adminUserId: string) {
    const normalizedAdminAccountId = (adminAccountId ?? '').trim();
    const normalizedAdminUserId = (adminUserId ?? '').trim();

    if (!normalizedAdminAccountId || !normalizedAdminUserId) {
      throw new BadRequestException('adminAccountId and adminUserId are required');
    }

    const draft = await this.adminActivityDraftsRepository.findOne({
      where: {
        adminAccountId: normalizedAdminAccountId,
        adminUserId: normalizedAdminUserId,
      },
    });

    return {
      success: true,
      data:
        draft && draft.draftData && (!draft.lastClearedAt || this.getDraftTimestamp(draft.draftData) > this.getDateTimestamp(draft.lastClearedAt))
          ? draft.draftData
          : null,
    };
  }

  async saveDraft(adminAccountId: string, adminUserId: string, draftData: Record<string, unknown>) {
    const normalizedAdminAccountId = (adminAccountId ?? '').trim();
    const normalizedAdminUserId = (adminUserId ?? '').trim();

    if (!normalizedAdminAccountId || !normalizedAdminUserId) {
      throw new BadRequestException('adminAccountId and adminUserId are required');
    }

    const normalizedDraft = this.normalizeDraftPayload(
      normalizedAdminAccountId,
      normalizedAdminUserId,
      draftData || {},
    );

    const existingDraft = await this.adminActivityDraftsRepository.findOne({
      where: {
        adminAccountId: normalizedAdminAccountId,
        adminUserId: normalizedAdminUserId,
      },
    });

    if (existingDraft) {
      const existingTimestamp = this.getDraftTimestamp(existingDraft.draftData);
      const clearedTimestamp = this.getDateTimestamp(existingDraft.lastClearedAt);
      const incomingTimestamp = this.getDraftTimestamp(normalizedDraft);
      if (Math.max(existingTimestamp, clearedTimestamp) > incomingTimestamp) {
        return {
          success: true,
          data:
            existingDraft.draftData && (!existingDraft.lastClearedAt || existingTimestamp > clearedTimestamp)
              ? existingDraft.draftData
              : null,
        };
      }
    }

    const draftRecord = existingDraft
      ? this.adminActivityDraftsRepository.merge(existingDraft, {
          draftData: normalizedDraft,
          lastClearedAt: null,
        })
      : this.adminActivityDraftsRepository.create({
          adminAccountId: normalizedAdminAccountId,
          adminUserId: normalizedAdminUserId,
          draftData: normalizedDraft,
          lastClearedAt: null,
        });

    const savedDraft = await this.adminActivityDraftsRepository.save(draftRecord);
    return {
      success: true,
      data: savedDraft.draftData,
    };
  }

  async clearDraft(adminAccountId: string, adminUserId: string) {
    const normalizedAdminAccountId = (adminAccountId ?? '').trim();
    const normalizedAdminUserId = (adminUserId ?? '').trim();

    if (!normalizedAdminAccountId || !normalizedAdminUserId) {
      throw new BadRequestException('adminAccountId and adminUserId are required');
    }

    const draft = await this.adminActivityDraftsRepository.findOne({
      where: {
        adminAccountId: normalizedAdminAccountId,
        adminUserId: normalizedAdminUserId,
      },
    });

    const clearedAt = new Date();
    const draftRecord = draft
      ? this.adminActivityDraftsRepository.merge(draft, {
          draftData: null,
          lastClearedAt: clearedAt,
        })
      : this.adminActivityDraftsRepository.create({
          adminAccountId: normalizedAdminAccountId,
          adminUserId: normalizedAdminUserId,
          draftData: null,
          lastClearedAt: clearedAt,
        });

    await this.adminActivityDraftsRepository.save(draftRecord);

    return {
      success: true,
      data: null,
    };
  }
}
