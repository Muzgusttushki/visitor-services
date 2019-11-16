import { IsDefined, IsEmail, IsString } from 'class-validator';

export class SignUpObject {
  @IsEmail()
  @IsDefined()
  public username: string;
  @IsDefined()
  @IsString()
  public password: string;
  
  @IsDefined()
  @IsString()
  public code: string;
}
