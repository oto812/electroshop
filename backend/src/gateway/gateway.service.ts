import { Injectable } from '@nestjs/common';
import { AppGateway } from './app.gateway';

@Injectable()
export class GatewayService {
  constructor(private gateway: AppGateway) {}

  emitOrderStatusUpdate(orderId: number, status: string) {
    this.gateway.server.to(`order-${orderId}`).emit('orderStatusUpdate', {
      orderId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  emitNewOrder(order: any) {
    this.gateway.server.to('admin-dashboard').emit('newOrder', order);
  }
}