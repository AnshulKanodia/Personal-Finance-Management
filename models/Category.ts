import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
    },
    color: {
      type: String,
      default: "#10b981", // Emerald default
      trim: true,
    },
    icon: {
      type: String,
      default: "Tag",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite in development hot reloading
const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
