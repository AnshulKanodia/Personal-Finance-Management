import React from "react";
import * as Icons from "lucide-react";
import { LucideProps } from "lucide-react";

interface CategoryIconProps extends LucideProps {
  name?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name = "Tag", ...props }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LucideIcon = (Icons as any)[name] || Icons.Tag;
  return <LucideIcon {...props} />;
};

export const AVAILABLE_ICONS = [
  "ShoppingCart",
  "Utensils",
  "Home",
  "ShoppingBag",
  "Fuel",
  "TrendingUp",
  "Briefcase",
  "Laptop",
  "HeartPulse",
  "Film",
  "Send",
  "Coffee",
  "Plane",
  "Car",
  "Wifi",
  "Smartphone",
  "Gift",
  "Music",
  "Book",
  "Dumbbell",
  "DollarSign",
  "Tag",
  "CreditCard",
  "Zap",
];
