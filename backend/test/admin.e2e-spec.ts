import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Admin API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should login with backend admin account', async () => {
    const response = await request(app.getHttpServer())
      .post('/admin/login')
      .send({
        account: 'ADMIN2024',
        password: 'HXP-ADMIN',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.account).toBe('ADMIN2024');
    expect(response.body.data.displayName).toBeTruthy();
    expect(response.body.data.adminAccountId).toBe('admin-account-001');
    expect(response.body.data.adminUserId).toBe('admin-user-001');
  });

  it('should reject invalid admin credentials', async () => {
    await request(app.getHttpServer())
      .post('/admin/login')
      .send({
        account: 'ADMIN2024',
        password: 'wrong-password',
      })
      .expect(401);
  });
});
