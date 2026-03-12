import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import * as bcrypt from 'bcrypt';




@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}
    private logger = new Logger('AuthService');

    async register(dto: RegisterDto){
        this.logger.log(`Registration attempt for ${dto.email}`);
        const existing = await this.prisma.user.findUnique({ where : { email : dto.email }});
        if (existing){
            throw new ConflictException('Email already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.password,10);
        const user = await this.prisma.user.create({
            data: { email: dto.email, password: hashedPassword },
        });

        const token = this.generateToken(user);
        this.logger.log(`User registered successfully: ${dto.email}`);
        return { user : {id: user.id, email: user.email, isAdmin: user.isAdmin }, token };
    }

    async login(dto: LoginDto){
        this.logger.log(`Login attempt for ${dto.email}`);

        const user = await this.prisma.user.findUnique( { where: { email: dto.email } });

        if(!user){
            throw new UnauthorizedException('invalid credentials');
        }
        const passwordMatch = await bcrypt.compare(dto.password, user.password);
        if(!passwordMatch){
            throw new UnauthorizedException('invalid credentials');
        }

        const token = this.generateToken(user);
        
        this.logger.log(`User logged in: ${dto.email}`);
        return { user: {id: user.id, email: user.email, isAdmin: user.isAdmin }, token };

    }
    private generateToken(user: { id: number; email: string; isAdmin: boolean }){
            const payload = {sub: user.id, email: user.email, isAdmin: user.isAdmin };
            return this.jwtService.sign(payload);
        }
}