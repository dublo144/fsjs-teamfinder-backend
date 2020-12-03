import mongoose, { Document, Schema } from 'mongoose';

export interface IGameArea {
  name: string;
  location: {
    type: string;
    coordinates: number[][][];
  };
}

interface IGameAreaDoc extends IGameArea, Document {}

const polygonSchema: Schema = new Schema({
  type: {
    type: String,
    enum: ['Polygon'],
    required: true
  },
  coordinates: {
    type: [[[Number]]], // Array of arrays of arrays of numbers
    required: true
  }
});

const gameAreaSchema: Schema = new Schema({
  name: {
    type: String,
    required: true
  },
  location: polygonSchema
});

gameAreaSchema.index({ location: '2dsphere' });

export default mongoose.model<IGameAreaDoc>('GameArea', gameAreaSchema);
