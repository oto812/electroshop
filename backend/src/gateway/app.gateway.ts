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

  private logger = new Logger('AppGateway');
  private chatHistory = new Map<number, ChatMessage[]>();

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
  handleJoinOrderRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: number },
  ) {
    const room = `order-${data.orderId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);

    const history = this.chatHistory.get(data.orderId) || [];
    this.logger.log(`Sending ${history.length} messages to ${client.id}`);
    client.emit('chatHistory', history);

    return { event: 'joinedRoom', room };
  }

  @SubscribeMessage('sendChatMessage')
  handleSendChatMessage(
    @MessageBody() data: { orderId: number; message: string; senderRole: string },
  ) {
    const payload: ChatMessage = {
      orderId: data.orderId,
      message: data.message,
      senderRole: data.senderRole,
      timestamp: new Date().toISOString(),
    };

    if (!this.chatHistory.has(data.orderId)) {
      this.chatHistory.set(data.orderId, []);
    }
    this.chatHistory.get(data.orderId)!.push(payload);

    this.logger.log(`Chat message in order ${data.orderId}: [${data.senderRole}] ${data.message}`);

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