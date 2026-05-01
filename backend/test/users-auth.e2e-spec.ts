import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Users auth flow', () => {
  let app: INestApplication;
  const runId = Date.now().toString();

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

  it('should create a user on first login and require profile completion', async () => {
    const phone = `139${runId.slice(-8)}`;
    const password = 'password123';

    const loginResponse = await request(app.getHttpServer())
      .post('/users/login')
      .send({ phone, password })
      .expect(201);

    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.needProfile).toBe(true);
    expect(loginResponse.body.data.phone).toBe(phone);
    expect(loginResponse.body.data.profileCompleted).toBe(false);
    expect(loginResponse.body.data.passwordHash).toBeUndefined();

    const userId = loginResponse.body.data.id;

    const profileResponse = await request(app.getHttpServer())
      .post('/users/profile')
      .send({
        id: userId,
        phone,
        name: '张航',
        studentId: `${runId.slice(-10)}01`,
        college: '计算机学院',
        className: '2023级1班',
      })
      .expect(201);

    expect(profileResponse.body.success).toBe(true);
    expect(profileResponse.body.data.profileCompleted).toBe(true);
    expect(profileResponse.body.data.passwordHash).toBeUndefined();

    const secondLoginResponse = await request(app.getHttpServer())
      .post('/users/login')
      .send({ phone, password })
      .expect(201);

    expect(secondLoginResponse.body.needProfile).toBe(false);
    expect(secondLoginResponse.body.data.id).toBe(userId);
    expect(secondLoginResponse.body.data.profileCompleted).toBe(true);
    expect(secondLoginResponse.body.data.passwordHash).toBeUndefined();
  });

  it('should reject an incorrect password', async () => {
    const phone = `138${runId.slice(-8)}`;

    await request(app.getHttpServer()).post('/users/login').send({ phone, password: 'password123' }).expect(201);

    await request(app.getHttpServer())
      .post('/users/login')
      .send({ phone, password: 'wrong-password' })
      .expect(401);
  });
});
