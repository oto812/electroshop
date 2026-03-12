import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";





@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || "your-secret-key-change-in-production"
        });
    }

    validate(payload: {sub: number; email: string; isAdmin: boolean }){
        return { userId: payload.sub, email: payload.email, isAdmin: payload.isAdmin }
    }
}