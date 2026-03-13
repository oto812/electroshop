import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

interface ChatMessage {
  orderId: number;
  message: string;
  senderRole: string;
  timestamp: string;
}

@WebSocketGateway({ cors: { origin: 'http://localhost:5173' } })
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}


  private logger = new Logger('AppGateway');

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

@SubscribeMessage('joinOrderRoom')
async handleJoinOrderRoom(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: { orderId: number },
) {
  const room = `order-${data.orderId}`;
  client.join(room);

  const dbMessages = await this.prisma.chatMessage.findMany({
    where: { orderId: data.orderId },
    orderBy: { createdAt: 'asc' },
  });

  const history: ChatMessage[] = dbMessages.map((m) => ({
    orderId: m.orderId,
    message: m.message,
    senderRole: m.senderRole,
    timestamp: m.createdAt.toISOString(),
  }));

  client.emit('chatHistory', history);
  return { event: 'joinedRoom', room };
}

@SubscribeMessage('sendChatMessage')
async handleSendChatMessage(
  @MessageBody() data: { orderId: number; message: string; senderRole: string },
) {
  const saved = await this.prisma.chatMessage.create({
    data: {
      orderId: data.orderId,
      message: data.message,
      senderRole: data.senderRole,
    },
  });

  const payload: ChatMessage = {
    orderId: saved.orderId,
    message: saved.message,
    senderRole: saved.senderRole,
    timestamp: saved.createdAt.toISOString(),
  };

  this.server.to(`order-${data.orderId}`).emit('chatMessage', payload);
  return payload;
}

  @SubscribeMessage('joinAdminDashboard')
  handleJoinAdminDashboard(@ConnectedSocket() client: Socket) {
    client.join('admin-dashboard');
    this.logger.log(`Client ${client.id} joined admin-dashboard`);
    return { event: 'joinedRoom', room: 'admin-dashboard' };
  }
}