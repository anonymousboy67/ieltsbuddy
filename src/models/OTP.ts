import mongoose, { Schema, Document, Model } from 'mongoose';
import { getUsersConnection } from '@/lib/mongodb-connections';

export interface IOTP extends Document {
  email: string;
  otp: string;
  username: string;
  password?: string; // Stored temporarily until verification
  fullName?: string;
  expiresAt: Date;
}

const OTPSchema: Schema = new Schema({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String }, // Optional: only needed for sign-up flow
  fullName: { type: String },
  expiresAt: { 
    type: Date, 
    required: true, 
    index: { expires: '10m' } // TTL index: automatic deletion after 10 minutes
  },
});

const usersConnection = getUsersConnection();
const OTP: Model<IOTP> =
  (usersConnection.models.OTP as Model<IOTP>) || usersConnection.model<IOTP>('OTP', OTPSchema);

export default OTP;
