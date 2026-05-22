import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email:    { type: String, required: true },
    name:     { type: String },
    image:    { type: String },
  },
  { timestamps: true, collection: 'users' }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
