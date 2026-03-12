import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { GeocodingService } from './geocoding.service';
import { GatewayModule } from 'src/gateway/gateway.module';

@Module({
  imports: [GatewayModule],
  controllers: [OrdersController],
  providers: [OrdersService, GeocodingService],
  exports: [OrdersService],
})
export class OrdersModule {}