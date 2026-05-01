import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Put, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: { account?: string; password?: string }) {
    return this.adminService.login(body.account ?? '', body.password ?? '');
  }

  @Get('draft')
  getDraft(@Query('adminAccountId') adminAccountId?: string, @Query('adminUserId') adminUserId?: string) {
    return this.adminService.getDraft(adminAccountId ?? '', adminUserId ?? '');
  }

  @Put('draft')
  saveDraft(
    @Body()
    body: {
      adminAccountId?: string;
      adminUserId?: string;
      draftData?: Record<string, unknown>;
    },
  ) {
    return this.adminService.saveDraft(body.adminAccountId ?? '', body.adminUserId ?? '', body.draftData ?? {});
  }

  @Delete('draft')
  clearDraft(@Query('adminAccountId') adminAccountId?: string, @Query('adminUserId') adminUserId?: string) {
    return this.adminService.clearDraft(adminAccountId ?? '', adminUserId ?? '');
  }
}
