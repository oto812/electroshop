import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../app.module';

describe('AppGateway', () => {
  let app: INestApplication;
  let clientSocket: Socket;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0); // random port

    const port = app.getHttpServer().address().port;
    clientSocket = io(`http://localhost:${port}`, {
      transports: ['websocket'],
      autoConnect: false,
    });
  });

  afterAll(async () => {
    clientSocket.disconnect();
    await app.close();
  });

  beforeEach((done) => {
    clientSocket.connect();
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    clientSocket.disconnect();
  });

  it('should join order room', (done) => {
    clientSocket.emit('joinOrderRoom', { orderId: 1 }, (response: any) => {
      expect(response.event).toBe('joinedRoom');
      expect(response.room).toBe('order-1');
      done();
    });
  });

  it('should join admin dashboard room', (done) => {
    clientSocket.emit('joinAdminDashboard', {}, (response: any) => {
      expect(response.event).toBe('joinedRoom');
      expect(response.room).toBe('admin-dashboard');
      done();
    });
  });

  it('should broadcast chat message to order room', (done) => {
    clientSocket.emit('joinOrderRoom', { orderId: 99 }, () => {
      clientSocket.on('chatMessage', (payload) => {
        expect(payload.orderId).toBe(99);
        expect(payload.message).toBe('Hello');
        expect(payload.senderRole).toBe('customer');
        expect(payload.timestamp).toBeDefined();
        done();
      });

      clientSocket.emit('sendChatMessage', {
        orderId: 99,
        message: 'Hello',
        senderRole: 'customer',
      });
    });
  });
});