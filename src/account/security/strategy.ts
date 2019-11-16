import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ManagementService } from '../management/management.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly managementService: ManagementService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'bnPdjBB@@2vg3yYfcmQP@cXtnhX6m0TQ*wx683!GvzKKeRq3',
    });
  }

  async validate(payload: { username: string; role: number }) {
    const request = await this.managementService.sessionVerification(
      payload.username,
      payload.role,
    );
    return request;
  }
}
