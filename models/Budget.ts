import mongoose, { Schema, Document, Model, Types } from "mongoose";
import "./Category"; // Ensure Category model is registered for populate

export interface IBudget extends Document {
  category: Types.ObjectId;
  monthlyLimit: number;
  month: string; // Format: YYYY-MM
  alertThreshold: number; // Percentage, e.g. 80
  rolloverUnspent: boolean; // Whether unspent headroom rolls over to next month
  rolledOverAmount: number; // Surplus rolled over from previous month
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category reference is required"],
    },
    monthlyLimit: {
      type: Number,
      required: [true, "Monthly budget limit is required"],
      min: [1, "Budget limit must be greater than zero"],
    },
    month: {
      type: String,
      required: [true, "Month in YYYY-MM format is required"],
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format"],
    },
    alertThreshold: {
      type: Number,
      default: 80,
      min: [10, "Threshold must be at least 10%"],
      max: [100, "Threshold cannot exceed 100%"],
    },
    rolloverUnspent: {
      type: Boolean,
      default: false,
    },
    rolledOverAmount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Unique compound index: one budget cap per category per month
BudgetSchema.index({ category: 1, month: 1 }, { unique: true });
BudgetSchema.index({ month: 1, isActive: 1 });

const Budget: Model<IBudget> =
  mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);

export default Budget;
