import { Document } from 'mongoose';

export interface AccountObject extends Document {
  username: string;
  role: number;
  sources: string[];
  pin: number;
  company_name: string;
  eq: string;
  access: string[];
}
