import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('login')
  async login(@Body() body: { phone?: string; password?: string }) {
    const { user, needProfile } = await this.usersService.login(body.phone ?? '', body.password ?? '');
    return { success: true, needProfile, data: user };
  }

  @Post('register')
  async register(@Body() userData: Partial<User>) {
    const user = await this.usersService.upsertProfile(userData);
    return { success: true, data: user };
  }

  @Post('profile')
  async upsertProfile(@Body() userData: Partial<User>) {
    const user = await this.usersService.upsertProfile(userData);
    return { success: true, data: user };
  }

  @Get('profile/:id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Get('student/:studentId')
  async findByStudentId(@Param('studentId') studentId: string) {
    const user = await this.usersService.findByStudentId(studentId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  @Get('phone/:phone')
  async findByPhone(@Param('phone') phone: string) {
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() userData: Partial<User>) {
    const user = await this.usersService.update(id, userData);
    return { success: true, data: user };
  }
}
