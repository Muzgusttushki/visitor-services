import { Body, Controller, Post } from '@nestjs/common';
import { SignUpService } from './signup.service';
import { SignUpObject } from '../../transferDataObject/account/SignUpObject';

@Controller('account/sign-up')
export class SignUpController {
  constructor(private readonly signUpService: SignUpService) {}
  @Post()
  async SignUp(@Body() AuthorizationState: SignUpObject) {
    const request = await this.signUpService.requestAccess(AuthorizationState);
    return request;
  }
}
