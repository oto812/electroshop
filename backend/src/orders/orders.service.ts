import { Logger, BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
import { GeocodingService } from './geocoding.service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { GatewayService } from '../gateway/gateway.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private geocodingService: GeocodingService,
    private gatewayService: GatewayService,

  ) {}
  private logger = new Logger('OrderService');

  async createOrder(userId: number, dto: CreateOrderDto) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate stock
    for (const item of cartItems) {
      if (item.quantity > item.product.stockQuantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.product.name}`,
        );
      }
    }

    // Generate dummy payment ID and hash it
    const rawPaymentId = uuidv4();
    const hashedPaymentId = await bcrypt.hash(rawPaymentId, 10);

    // Geocode address
    const coords = await this.geocodingService.geocode(dto.deliveryAddress);

    // Calculate total
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    // Transaction: create order, order items, decrement stock, clear cart
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          deliveryAddress: dto.deliveryAddress,
          deliveryLatitude: coords.lat,
          deliveryLongitude: coords.lng,
          paymentId: hashedPaymentId,
          orderItems: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtOrder: item.product.price,
            })),
          },
        },
        include: { orderItems: { include: { product: true } } },
      });

      // Decrement stock
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId } });


      return newOrder;
    });

    this.gatewayService.emitNewOrder(order);
    this.logger.log(`Order #${order.id} created for user ${userId}`);

    return order;
  }

  async findUserOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: { product: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOrderById(orderId: number, userId: number, isAdmin: boolean) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { include: { product: true } },
        user: { select: { email: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async findAllOrders() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { email: true } },
        orderItems: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(orderId: number, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    this.gatewayService.emitOrderStatusUpdate(orderId, status);

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { orderItems: { include: { product: true } } },
    });
  }
}