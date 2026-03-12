import { IsInt, IsNumber, IsString, Min } from "class-validator";

export class CreateProductDto {

    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsString()
    imageUrl: string;

    @IsNumber()
    price: number;

    @IsInt()
    @Min(0)
    stockQuantity: number;



}