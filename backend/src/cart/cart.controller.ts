import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { MergeCartDto } from './dto/merge-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@GetUser('userId') userId: number) {
    return this.cartService.getCart(userId);
  }

  @Post()
  addToCart(@GetUser('userId') userId: number, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(userId, dto);
  }

  @Patch(':productId')
  updateQuantity(
    @GetUser('userId') userId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateQuantity(userId, productId, quantity);
  }

  @Delete(':productId')
  removeFromCart(
    @GetUser('userId') userId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.cartService.removeFromCart(userId, productId);
  }

  @Post('merge')
  mergeCart(@GetUser('userId') userId: number, @Body() dto: MergeCartDto) {
    return this.cartService.mergeCart(userId, dto);
  }
}