import {
  ForbiddenException,
  HttpService,
  Injectable,
} from '@nestjs/common';
import { SignUpObject } from '../../transferDataObject/account/SignUpObject';
import { InjectModel } from '@nestjs/mongoose';
import { AccountObject } from '../../transferDataObject/account/AccountObject';
import { Model } from 'mongoose';
import { createHmac } from 'crypto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SignUpService {
  constructor(
    @InjectModel('users')
    private readonly usersCollection: Model<AccountObject>,
    private readonly http: HttpService,
    private readonly security: JwtService,
  ) { }

  async requestAccess(userData: SignUpObject): Promise<string> {
    await this.http
      .request({
        method: 'post',
        url: 'https://www.google.com/recaptcha/api/siteverify',
        params: {
          response: userData.code,
          secret: '6LeNarYUAAAAAE4pIE-9HtHJ4QQBXVfefwDsGMCC',
        },
      })
      .toPromise()
      .then(resolve => {
        if (!resolve || !resolve.data.success) {
          throw new ForbiddenException();
        }
        return resolve;
      });

    return await this.usersCollection
      .findOne(
        {
          username: { $eq: userData.username.toLowerCase() },
          eq: {
            $eq: createHmac('sha256', userData.password)
              .update(';W>eeKLrT#*!g2h_t6e<!cQYn&Q{r^h~R>_M')
              .digest('hex'),
          },
        },
        {
          _id: false,
          eq: false,
          sources: false,
          pin: false,
          __v: false,
        },
      )
      .then(async resolve => {
        if (!resolve) {
          throw new ForbiddenException();
        }

        return (await this.security.signAsync({
          username: resolve.username,
          company: resolve.company_name,
          role: resolve.role,
        }));
      });
  }
}
