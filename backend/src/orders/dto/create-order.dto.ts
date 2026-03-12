import { IsString, MinLength } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @MinLength(5)
  deliveryAddress: string;
}