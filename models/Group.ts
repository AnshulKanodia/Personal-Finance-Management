import mongoose, { Schema, Document } from "mongoose";

export interface IGroupMember {
  friendId?: mongoose.Types.ObjectId;
  name: string;
}

export interface IGroupExpenseSplit {
  name: string;
  shareAmount: number;
}

export interface IGroupExpense {
  _id?: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  paidBy: string; // Member name or "You"
  splitType: "EQUAL" | "EXACT";
  splitBetween: IGroupExpenseSplit[];
  date: Date;
  createdAt?: Date;
}

export interface IGroup extends Document {
  title: string;
  description?: string;
  members: IGroupMember[];
  expenses: IGroupExpense[];
  status: "ACTIVE" | "ARCHIVED";
  createdAt: Date;
  updatedAt: Date;
}

const GroupExpenseSplitSchema = new Schema<IGroupExpenseSplit>(
  {
    name: { type: String, required: true },
    shareAmount: { type: Number, required: true },
  },
  { _id: false }
);

const GroupExpenseSchema = new Schema<IGroupExpense>(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    paidBy: { type: String, required: true },
    splitType: { type: String, enum: ["EQUAL", "EXACT"], default: "EQUAL" },
    splitBetween: [GroupExpenseSplitSchema],
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const GroupSchema = new Schema<IGroup>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    members: [
      {
        friendId: { type: Schema.Types.ObjectId, ref: "Friend" },
        name: { type: String, required: true },
      },
    ],
    expenses: [GroupExpenseSchema],
    status: { type: String, enum: ["ACTIVE", "ARCHIVED"], default: "ACTIVE" },
  },
  { timestamps: true }
);

export default mongoose.models.Group || mongoose.model<IGroup>("Group", GroupSchema);
