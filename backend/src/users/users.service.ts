import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, pbkdf2 as pbkdf2Callback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

const DEFAULT_AVATAR_URL =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=campus%20student%20portrait%20friendly%20smile%20clean%20blue%20background%20professional%20avatar&image_size=square';
const DEFAULT_NICKNAME = '航小票用户';
const PBKDF2_ITERATIONS = 120000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = 'sha256';
const pbkdf2Async = promisify(pbkdf2Callback);

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private sanitizeUser(user: User) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private normalizeProfile(userData: Partial<User>): Partial<User> {
    const name = (userData.name ?? '').trim();
    const studentId = (userData.studentId ?? '').trim();
    const college = (userData.college ?? '').trim();
    const className = (userData.className ?? '').trim();
    const phone = (userData.phone ?? '').trim();
    const nickname = (userData.nickname ?? '').trim() || name || studentId || DEFAULT_NICKNAME;

    return {
      ...userData,
      name: name || null,
      studentId: studentId || null,
      college: college || null,
      className: className || null,
      phone: phone || null,
      nickname,
      avatarUrl: (userData.avatarUrl ?? '').trim() || DEFAULT_AVATAR_URL,
      profileCompleted: Boolean(name && studentId && college && className && phone),
    };
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

  private async findEntityById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async findById(id: number): Promise<User> {
    const user = await this.findEntityById(id);
    return this.sanitizeUser(user) as User;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const normalizedPhone = (phone ?? '').trim();
    if (!normalizedPhone) {
      return null;
    }

    const user = await this.usersRepository.findOne({ where: { phone: normalizedPhone } });
    return user ? (this.sanitizeUser(user) as User) : null;
  }

  async findByStudentId(studentId: string): Promise<User | null> {
    const normalizedStudentId = (studentId ?? '').trim();
    if (!normalizedStudentId) {
      return null;
    }

    const user = await this.usersRepository.findOne({ where: { studentId: normalizedStudentId } });
    return user ? (this.sanitizeUser(user) as User) : null;
  }

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find();
    return users.map((user) => this.sanitizeUser(user) as User);
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(this.normalizeProfile(userData));
    const savedUser = await this.usersRepository.save(user);
    return this.sanitizeUser(savedUser) as User;
  }

  async login(phone: string, password: string): Promise<{ user: User; needProfile: boolean }> {
    const normalizedPhone = (phone ?? '').trim();
    const normalizedPassword = (password ?? '').trim();

    if (!normalizedPhone || !normalizedPassword) {
      throw new BadRequestException('手机号和密码不能为空');
    }

    const existingUser = await this.usersRepository.findOne({ where: { phone: normalizedPhone } });

    if (!existingUser) {
      const createdUser = await this.usersRepository.save(
        this.usersRepository.create({
          phone: normalizedPhone,
          passwordHash: await this.hashPassword(normalizedPassword),
          profileCompleted: false,
          avatarUrl: DEFAULT_AVATAR_URL,
          nickname: DEFAULT_NICKNAME,
        }),
      );

      return { user: this.sanitizeUser(createdUser) as User, needProfile: true };
    }

    if (existingUser.passwordHash) {
      const matched = await this.verifyPassword(normalizedPassword, existingUser.passwordHash);
      if (!matched) {
        throw new UnauthorizedException('手机号或密码错误');
      }
    } else {
      existingUser.passwordHash = await this.hashPassword(normalizedPassword);
      await this.usersRepository.save(existingUser);
    }

    return { user: this.sanitizeUser(existingUser) as User, needProfile: !existingUser.profileCompleted };
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.findEntityById(id);
    const normalized = this.normalizeProfile({
      ...user,
      ...userData,
    });
    Object.assign(user, normalized);
    const savedUser = await this.usersRepository.save(user);
    return this.sanitizeUser(savedUser) as User;
  }

  async upsertProfile(userData: Partial<User>): Promise<User> {
    const normalized = this.normalizeProfile(userData);

    if (!normalized.phone) {
      throw new BadRequestException('手机号不能为空');
    }

    const existingUser = userData.id
      ? await this.usersRepository.findOne({ where: { id: userData.id } })
      : await this.usersRepository.findOne({ where: { phone: normalized.phone } });

    if (existingUser) {
      const mergedUser = this.usersRepository.merge(existingUser, normalized);
      mergedUser.profileCompleted = Boolean(
        mergedUser.name && mergedUser.studentId && mergedUser.college && mergedUser.className && mergedUser.phone,
      );
      const savedUser = await this.usersRepository.save(mergedUser);
      return this.sanitizeUser(savedUser) as User;
    }

    return this.create(normalized);
  }
}
