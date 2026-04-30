import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

const DEFAULT_AVATAR_URL =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=campus%20student%20portrait%20friendly%20smile%20clean%20blue%20background%20professional%20avatar&image_size=square';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private normalizeProfile(userData: Partial<User>): Partial<User> {
    const name = (userData.name ?? '').trim();
    const studentId = (userData.studentId ?? '').trim();
    const college = (userData.college ?? '').trim();
    const className = (userData.className ?? '').trim();
    const phone = (userData.phone ?? '').trim();
    const nickname = (userData.nickname ?? '').trim() || name || studentId || '航小票用户';

    return {
      ...userData,
      name,
      studentId,
      college,
      className,
      phone,
      nickname,
      avatarUrl: (userData.avatarUrl ?? '').trim() || DEFAULT_AVATAR_URL,
      profileCompleted: Boolean(name && studentId && college && className && phone),
    };
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(this.normalizeProfile(userData));
    return this.usersRepository.save(user);
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async findByStudentId(studentId: string): Promise<User | null> {
    if (!studentId) {
      return null;
    }
    return this.usersRepository.findOne({ where: { studentId } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, this.normalizeProfile(userData));
    return this.usersRepository.save(user);
  }

  async upsertProfile(userData: Partial<User>): Promise<User> {
    const normalized = this.normalizeProfile(userData);

    if (!normalized.studentId || !normalized.name || !normalized.college || !normalized.className || !normalized.phone) {
      throw new BadRequestException('请完整填写个人信息');
    }

    const existingUser = userData.id
      ? await this.usersRepository.findOne({ where: { id: userData.id } })
      : await this.findByStudentId(normalized.studentId);

    if (existingUser) {
      Object.assign(existingUser, normalized);
      return this.usersRepository.save(existingUser);
    }

    return this.create(normalized);
  }
}
