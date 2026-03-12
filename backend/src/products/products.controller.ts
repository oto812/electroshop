import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";




@Controller('products')
export class ProductsController {
    constructor (private productService: ProductsService) {}

    @Get()
    findAll(){
        return this.productService.findAll();
    }

    @Get('admin')
    @UseGuards(JwtAuthGuard, AdminGuard)
    findAllAdmin(){
        return this.productService.findAllAdmin();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.productService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, AdminGuard)
    create(@Body() dto: CreateProductDto) {
        return this.productService.create(dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard,AdminGuard) 
    update(@Param ('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto){
        return this.productService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard,AdminGuard)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.productService.remove(id);
    } 


}