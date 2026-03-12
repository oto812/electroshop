import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { GeocodingService } from './geocoding.service';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let orderId: number;

  const mockGeocodingService = {
    geocode: jest.fn().mockResolvedValue({ lat: 40.7128, lng: -74.006 }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GeocodingService)
      .useValue(mockGeocodingService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Login as admin
    const adminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' });
    adminToken = adminRes.body.token;

    // Register user
    const userRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'orderuser@example.com', password: 'password123' });
    userToken = userRes.body.token;

    // Add item to cart
    const productsRes = await request(app.getHttpServer()).get('/products');
    await request(app.getHttpServer())
      .post('/cart')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ productId: productsRes.body[0].id, quantity: 1 });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /orders', () => {
    it('should create order successfully', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ deliveryAddress: '123 Main Street, New York' })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.paymentId).toBeDefined();
          expect(res.body.orderItems.length).toBeGreaterThan(0);
          orderId = res.body.id;
        });
    });

    it('should fail with empty cart', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ deliveryAddress: '123 Main Street, New York' })
        .expect(400);
    });
  });

  describe('GET /orders', () => {
    it('should return only user orders', () => {
      return request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('GET /orders/all', () => {
    it('should return 403 for non-admin', () => {
      return request(app.getHttpServer())
        .get('/orders/all')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return all orders for admin', () => {
      return request(app.getHttpServer())
        .get('/orders/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('should return 403 for non-admin', () => {
      return request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'Processing' })
        .expect(403);
    });

    it('should update status for admin', () => {
      return request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Processing' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('Processing');
        });
    });
  });
});