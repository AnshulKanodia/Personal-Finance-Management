import mongoose, { Schema, Document, Model, Types } from "mongoose";
import "./Friend"; // Ensure Friend model is registered for populate

export type DueType = "TO_GIVE" | "TO_TAKE";
export type DuePaymentMode = "UPI" | "CASH";

export interface IFriendDue extends Document {
  friendId: Types.ObjectId;
  amount: number;
  type: DueType;
  isSettled: boolean;
  paymentMode: DuePaymentMode;
  notes?: string;
  date: Date;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FriendDueSchema = new Schema<IFriendDue>(
  {
    friendId: {
      type: Schema.Types.ObjectId,
      ref: "Friend",
      required: [true, "Friend reference is required"],
    },
    amount: {
      type: Number,
      required: [true, "Due amount is required"],
      min: [0.01, "Amount must be greater than zero"],
    },
    type: {
      type: String,
      enum: {
        values: ["TO_GIVE", "TO_TAKE"],
        message: "{VALUE} is not a valid due type",
      },
      required: [true, "Due type is required"],
    },
    isSettled: {
      type: Boolean,
      default: false,
    },
    paymentMode: {
      type: String,
      enum: {
        values: ["UPI", "CASH"],
        message: "{VALUE} is not a valid payment mode for dues",
      },
      default: "UPI",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    settledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

FriendDueSchema.index({ friendId: 1, isSettled: 1 });
FriendDueSchema.index({ type: 1, isSettled: 1 });

const FriendDue: Model<IFriendDue> =
  mongoose.models.FriendDue || mongoose.model<IFriendDue>("FriendDue", FriendDueSchema);

export default FriendDue;
