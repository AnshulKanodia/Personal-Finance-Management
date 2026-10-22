import mongoose, { Schema, Document, Model, Types } from "mongoose";
import "./Category";

export type BillingCycle = "MONTHLY" | "QUARTERLY" | "YEARLY";
export type SubscriptionPaymentMode = "UPI" | "CARD" | "NET_BANKING" | "CASH";

export interface ISubscription extends Document {
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  dueDay: number;
  category?: Types.ObjectId;
  paymentMode: SubscriptionPaymentMode;
  autoRenew: boolean;
  isActive: boolean;
  lastPaidAt?: Date;
  nextDueDate: Date;
  reminderDaysBefore: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    name: {
      type: String,
      required: [true, "Subscription name is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Subscription amount is required"],
      min: [0.01, "Amount must be greater than zero"],
    },
    billingCycle: {
      type: String,
      enum: {
        values: ["MONTHLY", "QUARTERLY", "YEARLY"],
        message: "{VALUE} is not a valid billing cycle",
      },
      default: "MONTHLY",
    },
    dueDay: {
      type: Number,
      required: [true, "Due day is required"],
      min: [1, "Due day must be between 1 and 31"],
      max: [31, "Due day must be between 1 and 31"],
      default: 1,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    paymentMode: {
      type: String,
      enum: {
        values: ["UPI", "CARD", "NET_BANKING", "CASH"],
        message: "{VALUE} is not a valid payment mode",
      },
      default: "UPI",
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastPaidAt: {
      type: Date,
    },
    nextDueDate: {
      type: Date,
      required: true,
    },
    reminderDaysBefore: {
      type: Number,
      default: 3,
      min: 0,
      max: 14,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

SubscriptionSchema.index({ isActive: 1, nextDueDate: 1 });

const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", SubscriptionSchema);

export default Subscription;
