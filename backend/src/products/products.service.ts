import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";



@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) {}

    async findAll(){
        return this.prisma.product.findMany({
            where: { stockQuantity : { gt : 0  }}, 
        });
    }
    
    async findAllAdmin(){
        return this.prisma.product.findMany();
    }

    async findOne(id: number){
        const product = this.prisma.product.findUnique( { where : { id }});

        if(!product) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }

    async create(dto: CreateProductDto){
        const existing = await this.prisma.product.findUnique( { where: { name : dto.name } });
        if(existing){
            throw new ConflictException('Product with this name already exists');
        }
        return this.prisma.product.create({ data: dto });
    }

    async update(id: number, dto : UpdateProductDto){
        const product = await this.prisma.product.findUnique({ where: { id } });
        if(!product){
            throw new NotFoundException('Product not found');
        }
        return this.prisma.product.update({where : { id }, data : dto });

    }
    async remove(id: number){
        const product = await this.prisma.product.findUnique({ where : { id } });
        if(!product){
            throw new NotFoundException('Product not found');
        }
        return this.prisma.product.delete({ where: { id } });
    }
}