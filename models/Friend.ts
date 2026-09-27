import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFriend extends Document {
  name: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FriendSchema = new Schema<IFriend>(
  {
    name: {
      type: String,
      required: [true, "Friend name is required"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

FriendSchema.index({ name: 1 });

const Friend: Model<IFriend> =
  mongoose.models.Friend || mongoose.model<IFriend>("Friend", FriendSchema);

export default Friend;
