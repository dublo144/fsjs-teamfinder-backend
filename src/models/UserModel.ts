import mongoose, { Document, Schema } from 'mongoose';

export interface IGameUser {
  name: string;
  userName: string;
  password: string;
  role: string;
  position: object | null;
}

interface IGameUserDoc extends IGameUser, Document {}

const userSchema: Schema = new Schema({
  name: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  }
});

export default mongoose.model<IGameUserDoc>('User', userSchema);
