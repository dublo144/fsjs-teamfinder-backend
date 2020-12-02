import mongoose, { Document, Schema } from 'mongoose';

export interface IPosition {
  lastUpdated: Date;
  userName: string;
  location: {
    type: string;
    coordinates: Array<number>;
  };
}

interface IPositionDoc extends IPosition, Document {}

const pointSchema: Schema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
});

const positionSchema = new Schema({
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  userName: {
    type: String,
    required: true
  },
  location: {
    type: pointSchema,
    required: true
  }
});

positionSchema.index({ lastUpdated: 1 }, { expireAfterSeconds: 30 });
positionSchema.index({ location: '2dsphere' });

export default mongoose.model<IPositionDoc>('Position', positionSchema);
