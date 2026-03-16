import { Body, Controller, Post, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthCryptoService } from './auth-crypto.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly authCryptoService: AuthCryptoService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('public-key')
  getPublicKey() {
    return this.authCryptoService.getPublicKeyJwk();
  }
}
