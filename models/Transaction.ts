import mongoose, { Schema, Document, Model, Types } from "mongoose";
import "./Category"; // Ensure Category model is registered for populate

export type TransactionType = "EXPENSE" | "INCOME";
export type PaymentMode = "UPI" | "CASH" | "CARD" | "NET_BANKING";

export interface ITransaction extends Document {
  amount: number;
  type: TransactionType;
  paymentMode: PaymentMode;
  category: Types.ObjectId;
  notes?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    amount: {
      type: Number,
      required: [true, "Transaction amount is required"],
      min: [0.01, "Amount must be greater than zero"],
    },
    type: {
      type: String,
      enum: {
        values: ["EXPENSE", "INCOME"],
        message: "{VALUE} is not a valid transaction type",
      },
      required: [true, "Transaction type is required"],
    },
    paymentMode: {
      type: String,
      enum: {
        values: ["UPI", "CASH", "CARD", "NET_BANKING"],
        message: "{VALUE} is not a valid payment mode",
      },
      required: [true, "Payment mode is required"],
      default: "UPI",
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for high-performance monthly and category aggregations
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ category: 1 });
TransactionSchema.index({ type: 1, date: -1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
