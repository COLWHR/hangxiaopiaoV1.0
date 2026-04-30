import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
        totalTickets: 100,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Test Activity');
    expect(response.body.availableTickets).toBe(100);
  });

  it('should book a ticket', async () => {
    // First create an activity
    const activityResponse = await request(app.getHttpServer())
      .post('/activities')
      .send({
        title: 'Test Activity for Booking',
        description: 'Test Description',
        totalTickets: 100,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

    const activityId = activityResponse.body.id;
    const userResponse = await createTestUser('1');
    const userId = userResponse.body.data.id;

    // Then book a ticket
    const ticketResponse = await request(app.getHttpServer())
      .post('/tickets/book')
      .send({
        activityId: activityId,
        userId: userId,
      })
      .expect(201);

    expect(ticketResponse.body).toHaveProperty('id');
    expect(ticketResponse.body.activityId).toBe(activityId);
    expect(ticketResponse.body.userId).toBe(1);
    expect(ticketResponse.body).toHaveProperty('ticketNumber');
    expect(ticketResponse.body).toHaveProperty('seatNumber');
  });

  it('should get ticket by number', async () => {
    // First create an activity
    const activityResponse = await request(app.getHttpServer())
      .post('/activities')
      .send({
        title: 'Test Activity for Ticket Detail',
        description: 'Test Description',
        totalTickets: 100,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

    const activityId = activityResponse.body.id;
    const userResponse = await createTestUser('2');
    const userId = userResponse.body.data.id;

    // Then book a ticket
    const ticketResponse = await request(app.getHttpServer())
      .post('/tickets/book')
      .send({
        activityId: activityId,
        userId: userId,
      });

    const ticketNumber = ticketResponse.body.ticketNumber;

    // Then get ticket by number
    const ticketDetailResponse = await request(app.getHttpServer())
      .get(`/tickets/by-number/${ticketNumber}`)
      .expect(200);

    expect(ticketDetailResponse.body.ticketNumber).toBe(ticketNumber);
    expect(ticketDetailResponse.body).toHaveProperty('activity');
    expect(ticketDetailResponse.body).toHaveProperty('ticketStub');
  });

  it('should not allow booking when tickets are sold out', async () => {
    // First create an activity with 1 ticket
    const activityResponse = await request(app.getHttpServer())
      .post('/activities')
      .send({
        title: 'Test Activity for Sold Out',
        description: 'Test Description',
        totalTickets: 1,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

    const activityId = activityResponse.body.id;
    const firstUserResponse = await createTestUser('3');
    const secondUserResponse = await createTestUser('4');

    // Book the only ticket
    await request(app.getHttpServer())
      .post('/tickets/book')
      .send({
        activityId: activityId,
        userId: firstUserResponse.body.data.id,
      })
      .expect(201);

    // Try to book another ticket
    await request(app.getHttpServer())
      .post('/tickets/book')
      .send({
        activityId: activityId,
        userId: secondUserResponse.body.data.id,
      })
      .expect(400);
  });

  it('should not allow booking the same activity twice', async () => {
    // First create an activity
    const activityResponse = await request(app.getHttpServer())
      .post('/activities')
      .send({
        title: 'Test Activity for Duplicate Booking',
        description: 'Test Description',
        totalTickets: 100,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

    const activityId = activityResponse.body.id;
    const userResponse = await createTestUser('5');
    const userId = userResponse.body.data.id;

    // Book a ticket
    await request(app.getHttpServer())
      .post('/tickets/book')
      .send({
        activityId: activityId,
        userId: userId,
      })
      .expect(201);

    // Try to book again
    await request(app.getHttpServer())
      .post('/tickets/book')
      .send({
        activityId: activityId,
        userId: userId,
      })
      .expect(400);
  });
});
