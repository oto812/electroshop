import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('CartController (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let productId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Register a user
    const userRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'cartuser@example.com', password: 'password123' });
    userToken = userRes.body.token;

    // Get a product
    const productsRes = await request(app.getHttpServer()).get('/products');
    productId = productsRes.body[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /cart', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/cart')
        .send({ productId, quantity: 1 })
        .expect(401);
    });

    it('should add to cart for authenticated user', () => {
      return request(app.getHttpServer())
        .post('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId, quantity: 1 })
        .expect(201)
        .expect((res) => {
          expect(res.body.productId).toBe(productId);
          expect(res.body.quantity).toBe(1);
        });
    });

    it('should fail for out-of-stock quantity', () => {
      return request(app.getHttpServer())
        .post('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId, quantity: 99999 })
        .expect(400);
    });
  });

  describe('PATCH /cart/:productId', () => {
    it('should update quantity to 0 and remove item', () => {
      return request(app.getHttpServer())
        .patch(`/cart/${productId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 0 })
        .expect(200);
    });
  });

  describe('POST /cart/merge', () => {
    it('should merge guest cart items', () => {
      return request(app.getHttpServer())
        .post('/cart/merge')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ items: [{ productId, quantity: 2 }] })
        .expect(201)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('GET /cart', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/cart')
        .expect(401);
    });

    it('should return cart for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('DELETE /cart/:productId', () => {
    it('should remove item from cart', () => {
      return request(app.getHttpServer())
        .delete(`/cart/${productId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });
  });
});