import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number according to the Indian numbering system (Lakhs, Crores) with the Rupee symbol.
 * Example: 150000 -> ₹1,50,000
 */
export function formatINR(
  amount: number | null | undefined,
  options: { showSymbol?: boolean; decimals?: boolean } = {}
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return options.showSymbol !== false ? "₹0" : "0";
  }

  const { showSymbol = true, decimals = false } = options;

  const formatter = new Intl.NumberFormat("en-IN", {
    style: showSymbol ? "currency" : "decimal",
    currency: "INR",
    minimumFractionDigits: decimals ? (amount % 1 !== 0 ? 2 : 0) : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });

  return formatter.format(amount);
}

/**
 * Format date in friendly Indian / human-readable format
 */
export function formatDate(dateInput: string | Date | number | undefined): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(dateInput: string | Date | number | undefined): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export const DEFAULT_CATEGORIES = [
  { name: "Entertainment", color: "#a855f7", icon: "Film" },
  { name: "Food & Dining", color: "#f59e0b", icon: "Utensils" },
  { name: "Freelance", color: "#3b82f6", icon: "Laptop" },
  { name: "Groceries", color: "#10b981", icon: "ShoppingCart" },
  { name: "Health & Medical", color: "#ef4444", icon: "HeartPulse" },
  { name: "Investments & SIP", color: "#14b8a6", icon: "TrendingUp" },
  { name: "Other", color: "#71717a", icon: "MoreHorizontal" },
  { name: "Rent & Bills", color: "#06b6d4", icon: "Home" },
  { name: "Salary", color: "#22c55e", icon: "Briefcase" },
  { name: "Shopping", color: "#ec4899", icon: "ShoppingBag" },
  { name: "Snacks", color: "#f97316", icon: "Coffee" },
  { name: "Travel & Fuel", color: "#8b5cf6", icon: "Fuel" },
  { name: "UPI Transfers", color: "#0ea5e9", icon: "Send" },
  { name: "Water", color: "#06b6d4", icon: "Droplets" },
];
