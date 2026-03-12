import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let createdProductId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Login as admin
    const adminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' });
    adminToken = adminRes.body.token;

    // Register a regular user
    const userRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'user@example.com', password: 'user123456' });
    userToken = userRes.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /products', () => {
    it('should return only in-stock products', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((p: any) => {
            expect(p.stockQuantity).toBeGreaterThan(0);
          });
        });
    });
  });

  describe('GET /products/admin', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/products/admin')
        .expect(401);
    });

    it('should return 403 with non-admin token', () => {
      return request(app.getHttpServer())
        .get('/products/admin')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return all products with admin token', () => {
      return request(app.getHttpServer())
        .get('/products/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('POST /products', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Test', description: 'Test', imageUrl: 'http://test.com', price: 10, stockQuantity: 5 })
        .expect(401);
    });

    it('should return 403 with non-admin token', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test', description: 'Test', imageUrl: 'http://test.com', price: 10, stockQuantity: 5 })
        .expect(403);
    });

    it('should create product with admin token', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Product', description: 'A test product', imageUrl: 'http://test.com/img.png', price: 19.99, stockQuantity: 10 })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('Test Product');
          createdProductId = res.body.id;
        });
    });
  });

  describe('PATCH /products/:id', () => {
    it('should update product with admin token', () => {
      return request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 24.99 })
        .expect(200)
        .expect((res) => {
          expect(Number(res.body.price)).toBe(24.99);
        });
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete product with admin token', () => {
      return request(app.getHttpServer())
        .delete(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});