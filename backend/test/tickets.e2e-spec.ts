import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Tickets API', () => {
  let app: INestApplication;
  const runId = Date.now().toString();

  const createTestUser = async (suffix: string) => {
    return request(app.getHttpServer())
      .post('/users/profile')
      .send({
        name: `Test User ${suffix}`,
        studentId: `${runId.slice(-10)}${suffix}`,
        college: '计算机学院',
        className: '2023级1班',
        phone: `1380000${suffix.padStart(4, '0')}`,
      })
      .expect(201);
  };

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

  it('should create an activity', async () => {
    const response = await request(app.getHttpServer())
      .post('/activities')
      .send({
        title: 'Test Activity',
        description: 'Test Description',
        location: '体育馆',
        coverImageUrl: 'https://example.com/activity-cover.png',
        totalTickets: 100,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Test Activity');
    expect(response.body.availableTickets).toBe(100);
    expect(response.body.location).toBe('体育馆');
    expect(response.body.coverImageUrl).toBe('https://example.com/activity-cover.png');
  });

  it('should publish an activity and make it bookable for the user app', async () => {
    const response = await request(app.getHttpServer())
      .post('/activities')
      .send({
        title: 'Publisher Created Activity',
        description: 'Published from publisher miniapp',
        location: '主会场',
        coverImageUrl: 'https://example.com/publisher-cover.png',
        totalTickets: 50,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        status: 'published',
        adminAccountId: 'admin-account-001',
        adminUserId: 'admin-user-001',
      })
      .expect(201);

    expect(response.body.status).toBe('published');

    const fetched = await request(app.getHttpServer())
      .get(`/activities/${response.body.id}`)
      .expect(200);

    expect(fetched.body.title).toBe('Publisher Created Activity');
    expect(fetched.body.status).toBe('published');

    const userResponse = await createTestUser('6');

    const ticketResponse = await request(app.getHttpServer())
      .post('/tickets/book')
      .send({
        activityId: response.body.id,
        userId: userResponse.body.data.id,
      })
      .expect(201);

    expect(ticketResponse.body.activityId).toBe(response.body.id);
  });

  it('should allow revoke, edit and republish the same activity', async () => {
    const adminAccountId = `admin-account-flow-${runId}`;
    const adminUserId = `admin-user-flow-${runId}`;
    const createResponse = await request(app.getHttpServer())
      .post('/activities')
      .send({
        title: `Manageable Activity ${runId}`,
        description: 'Created for the republish flow',
        location: '综合楼大厅',
        coverImageUrl: 'https://example.com/manageable-cover.png',
        totalTickets: 20,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        status: 'published',
        adminAccountId,
        adminUserId,
      })
      .expect(201);

    const activityId = createResponse.body.id;
    const userResponse = await createTestUser('7');

    await request(app.getHttpServer())
      .post('/tickets/book')
      .send({
        activityId,
        userId: userResponse.body.data.id,
      })
      .expect(201);

    const revokedResponse = await request(app.getHttpServer())
      .patch(`/activities/${activityId}`)
      .send({
        status: 'revoked',
      })
      .expect(200);

    expect(revokedResponse.body.status).toBe('revoked');

    const republishedResponse = await request(app.getHttpServer())
      .patch(`/activities/${activityId}`)
      .send({
        title: 'Manageable Activity Updated',
        description: 'Edited after revoke and published again',
        totalTickets: 24,
        status: 'published',
        adminAccountId,
        adminUserId,
      })
      .expect(200);

    expect(republishedResponse.body.status).toBe('published');
    expect(republishedResponse.body.title).toBe('Manageable Activity Updated');
    expect(republishedResponse.body.availableTickets).toBe(23);

    const filteredList = await request(app.getHttpServer())
      .get('/activities')
      .query({
        adminAccountId,
        adminUserId,
      })
      .expect(200);

    expect(filteredList.body).toHaveLength(1);
    expect(filteredList.body[0].id).toBe(activityId);

    const secondUserResponse = await createTestUser('8');
    const republishTicketResponse = await request(app.getHttpServer())
      .post('/tickets/book')
      .send({
        activityId,
        userId: secondUserResponse.body.data.id,
      })
      .expect(201);

    expect(republishTicketResponse.body.activityId).toBe(activityId);
  });

  it('should book a ticket', async () => {
    const activityResponse = await request(app.getHttpServer())
      .post('/activities')
      .send({
        title: 'Test Activity for Booking',
        description: 'Test Description',
        location: '体育馆',
        totalTickets: 100,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

    const activityId = activityResponse.body.id;
    const userResponse = await createTestUser('1');
    const userId = userResponse.body.data.id;

    const ticketResponse = await request(app.getHttpServer())
      .post('/tickets/book')
      .send({
        activityId,
        userId,
      })
      .expect(201);

    expect(ticketResponse.body).toHaveProperty('id');
    expect(ticketResponse.body.activityId).toBe(activityId);
    expect(ticketResponse.body.userId).toBe(userId);
    expect(ticketResponse.body).toHaveProperty('ticketNumber');
    expect(ticketResponse.body).toHaveProperty('seatNumber');
  });

  it('should get ticket by number', async () => {
    const activityResponse = await request(app.getHttpServer())
      .post('/activities')
      .send({
        title: 'Test Activity for Ticket Detail',
        description: 'Test Description',
        location: '大礼堂',
        totalTickets: 100,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

    const activityId = activityResponse.body.id;
    const userResponse = await createTestUser('2');
    const userId = userResponse.body.data.id;

    const ticketResponse = await request(app.getHttpServer())
      .post('/tickets/book')
      .send({
        activityId,
        userId,
      });

    const ticketNumber = ticketResponse.body.ticketNumber;

    const ticketDetailResponse = await request(app.getHttpServer())
      .get(`/tickets/by-number/${ticketNumber}`)
      .expect(200);

    expect(ticketDetailResponse.body.ticketNumber).toBe(ticketNumber);
    expect(ticketDetailResponse.body).toHaveProperty('activity');
    expect(ticketDetailResponse.body).toHaveProperty('ticketStub');
  });

  it('should not allow booking when tickets are sold out', async () => {
    const activityResponse = await request(app.getHttpServer())
      .post('/activities')
      .send({
        title: 'Test Activity for Sold Out',
        description: 'Test Description',
        location: '体育馆',
        totalTickets: 1,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

    const activityId = activityResponse.body.id;
    const firstUserResponse = await createTestUser('3');
    const secondUserResponse = await createTestUser('4');

    await request(app.getHttpServer())
      .post('/tickets/book')
      .send({
        activityId,
        userId: firstUserResponse.body.data.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/tickets/book')
      .send({
        activityId,
        userId: secondUserResponse.body.data.id,
      })
      .expect(400);
  });

  it('should not allow booking the same activity twice', async () => {
    const activityResponse = await request(app.getHttpServer())
      .post('/activities')
      .send({
        title: 'Test Activity for Duplicate Booking',
        description: 'Test Description',
        location: '体育馆',
        totalTickets: 100,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

    const activityId = activityResponse.body.id;
    const userResponse = await createTestUser('5');
    const userId = userResponse.body.data.id;

    await request(app.getHttpServer())
      .post('/tickets/book')
      .send({
        activityId,
        userId,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/tickets/book')
      .send({
        activityId,
        userId,
      })
      .expect(400);
  });
});
