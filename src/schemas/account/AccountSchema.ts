import * as mongoose from 'mongoose';

export const AccountSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  role: Number,
  sources: Array<string>(),
  pin: Number,
  companyName: String,
  eq: String,
  access: Array<String>()
});
