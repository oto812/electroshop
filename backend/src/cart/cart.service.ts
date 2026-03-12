import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { MergeCartDto } from './dto/merge-cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: number) {
    return this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });
  }

  async addToCart(userId: number, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingItem = await this.prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });

    const newQuantity = (existingItem?.quantity || 0) + dto.quantity;

    if (newQuantity > product.stockQuantity) {
      throw new BadRequestException('Not enough stock available');
    }

    return this.prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId: dto.productId } },
      update: { quantity: newQuantity },
      create: { userId, productId: dto.productId, quantity: dto.quantity },
      include: { product: true },
    });
  }

  async updateQuantity(userId: number, productId: number, quantity: number) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity === 0) {
      return this.prisma.cartItem.delete({
        where: { userId_productId: { userId, productId } },
      });
    }

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (quantity > product!.stockQuantity) {
      throw new BadRequestException('Not enough stock available');
    }

    return this.prisma.cartItem.update({
      where: { userId_productId: { userId, productId } },
      data: { quantity },
      include: { product: true },
    });
  }

  async removeFromCart(userId: number, productId: number) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.delete({
      where: { userId_productId: { userId, productId } },
    });
  }

  async clearCart(userId: number) {
    return this.prisma.cartItem.deleteMany({ where: { userId } });
  }

  async mergeCart(userId: number, dto: MergeCartDto) {
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;

      const existing = await this.prisma.cartItem.findUnique({
        where: { userId_productId: { userId, productId: item.productId } },
      });

      const mergedQuantity = Math.min(
        Math.max(existing?.quantity || 0, item.quantity),
        product.stockQuantity,
      );

      await this.prisma.cartItem.upsert({
        where: { userId_productId: { userId, productId: item.productId } },
        update: { quantity: mergedQuantity },
        create: { userId, productId: item.productId, quantity: mergedQuantity },
      });
    }

    return this.getCart(userId);
  }
}