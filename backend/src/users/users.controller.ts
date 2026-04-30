import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('login')
  @Post('register')
  @Post('profile')
  async upsertProfile(@Body() userData: Partial<User>) {
    const user = await this.usersService.upsertProfile(userData);
    return { success: true, data: user };
  }

  @Get('profile/:id')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(Number(id));
  }

  @Get('student/:studentId')
  async findByStudentId(@Param('studentId') studentId: string) {
    const user = await this.usersService.findByStudentId(studentId);
    if (!user) {
      throw new Error('用户不存在');
    }
    return user;
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() userData: Partial<User>) {
    const user = await this.usersService.update(id, userData);
    return { success: true, data: user };
  }
}
