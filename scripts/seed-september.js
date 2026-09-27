const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

// Schemas
const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    color: { type: String, default: "#10b981" },
    icon: { type: String, default: "Tag" },
  },
  { timestamps: true }
);

const TransactionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    type: { type: String, enum: ["EXPENSE", "INCOME"], required: true },
    paymentMode: { type: String, enum: ["UPI", "CASH", "CARD", "NET_BANKING"], required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    notes: { type: String, default: "" },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);

const RAW_DATA = [
  { dateStr: "2026-09-02", paymentMode: "UPI", amount: 30, reason: "MEDICINE", categoryName: "Health & Medical" },
  { dateStr: "2026-09-03", paymentMode: "UPI", amount: 20, reason: "MEDICINE", categoryName: "Health & Medical" },
  { dateStr: "2026-09-03", paymentMode: "UPI", amount: 30, reason: "BISCUIT / SNACKS", categoryName: "Snacks" },
  { dateStr: "2026-09-03", paymentMode: "UPI", amount: 30, reason: "WATER", categoryName: "Water" },
  { dateStr: "2026-09-04", paymentMode: "UPI", amount: 215, reason: "WATER", categoryName: "Water" },
  { dateStr: "2026-09-04", paymentMode: "UPI", amount: 145, reason: "DINNER", categoryName: "Food & Dining (Lunch & Dinner)" },
  { dateStr: "2026-09-07", paymentMode: "CASH", amount: 80, reason: "SNACK", categoryName: "Snacks" },
  { dateStr: "2026-09-09", paymentMode: "UPI", amount: 215, reason: "WATER", categoryName: "Water" },
  { dateStr: "2026-09-10", paymentMode: "UPI", amount: 75, reason: "SNACK", categoryName: "Snacks" },
  { dateStr: "2026-09-11", paymentMode: "UPI", amount: 60, reason: "SNACK", categoryName: "Snacks" },
  { dateStr: "2026-09-12", paymentMode: "UPI", amount: 195, reason: "DINNER", categoryName: "Food & Dining (Lunch & Dinner)" },
  { dateStr: "2026-09-13", paymentMode: "UPI", amount: 126, reason: "WATER", categoryName: "Water" },
  { dateStr: "2026-09-14", paymentMode: "UPI", amount: 40, reason: "SNACK", categoryName: "Snacks" },
  { dateStr: "2026-09-15", paymentMode: "UPI", amount: 120, reason: "SNACK", categoryName: "Snacks" },
  { dateStr: "2026-09-16", paymentMode: "UPI", amount: 108, reason: "WATER", categoryName: "Water" },
  { dateStr: "2026-09-16", paymentMode: "UPI", amount: 90, reason: "CLOTHS", categoryName: "Shopping" },
  { dateStr: "2026-09-17", paymentMode: "CASH", amount: 90, reason: "SNACK", categoryName: "Snacks" },
  { dateStr: "2026-09-19", paymentMode: "UPI", amount: 378, reason: "WATER", categoryName: "Water" },
  { dateStr: "2026-09-19", paymentMode: "UPI", amount: 70, reason: "SNACK", categoryName: "Snacks" },
  { dateStr: "2026-09-21", paymentMode: "UPI", amount: 100, reason: "SNACK", categoryName: "Snacks" },
  { dateStr: "2026-09-23", paymentMode: "UPI", amount: 20, reason: "SNACK", categoryName: "Snacks" },
  { dateStr: "2026-09-25", paymentMode: "UPI", amount: 73, reason: "COLGATE", categoryName: "Groceries" },
  { dateStr: "2026-09-25", paymentMode: "UPI", amount: 20, reason: "SNACK", categoryName: "Snacks" },
  { dateStr: "2026-09-26", paymentMode: "UPI", amount: 120, reason: "SNACK", categoryName: "Snacks" },
];

const CATEGORY_DEFINITIONS = [
  { name: "Water", color: "#0ea5e9", icon: "Coffee" },
  { name: "Snacks", color: "#f59e0b", icon: "Cookie" },
  { name: "Food & Dining (Lunch & Dinner)", color: "#f43f5e", icon: "Utensils" },
  { name: "Health & Medical", color: "#ef4444", icon: "HeartPulse" },
  { name: "Shopping", color: "#ec4899", icon: "ShoppingBag" },
  { name: "Groceries", color: "#10b981", icon: "ShoppingCart" },
  { name: "Rent & Bills", color: "#06b6d4", icon: "Home" },
  { name: "Travel & Fuel", color: "#8b5cf6", icon: "Fuel" },
  { name: "Salary", color: "#22c55e", icon: "Briefcase" },
  { name: "UPI Transfers", color: "#0ea5e9", icon: "Send" },
  { name: "Other", color: "#71717a", icon: "MoreHorizontal" },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!");

    // 1. Ensure categories exist or create them
    const categoryMap = {};

    for (const catDef of CATEGORY_DEFINITIONS) {
      let cat = await Category.findOne({ name: catDef.name });
      if (!cat) {
        // Also check if legacy "Food & Dining" exists and rename it
        if (catDef.name === "Food & Dining (Lunch & Dinner)") {
          const oldFood = await Category.findOne({ name: "Food & Dining" });
          if (oldFood) {
            oldFood.name = "Food & Dining (Lunch & Dinner)";
            await oldFood.save();
            cat = oldFood;
          }
        }
      }

      if (!cat) {
        cat = await Category.create(catDef);
        console.log(`Created category: ${cat.name} (${cat.color})`);
      } else {
        console.log(`Found category: ${cat.name}`);
      }
      categoryMap[cat.name] = cat._id;
    }

    // 2. Insert transactions
    console.log("\nInserting September transactions...");
    let insertedCount = 0;

    for (const item of RAW_DATA) {
      const categoryId = categoryMap[item.categoryName];
      if (!categoryId) {
        console.error(`Category not found for: ${item.categoryName}`);
        continue;
      }

      const txDate = new Date(item.dateStr + "T12:00:00.000Z");

      // Check if transaction already exists (avoid duplicates on re-run)
      const existing = await Transaction.findOne({
        amount: item.amount,
        type: "EXPENSE",
        paymentMode: item.paymentMode,
        category: categoryId,
        notes: item.reason,
        date: txDate,
      });

      if (!existing) {
        await Transaction.create({
          amount: item.amount,
          type: "EXPENSE",
          paymentMode: item.paymentMode,
          category: categoryId,
          notes: item.reason,
          date: txDate,
        });
        insertedCount++;
        console.log(`Inserted: ${item.dateStr} | ${item.paymentMode} | ₹${item.amount} | ${item.categoryName} (${item.reason})`);
      } else {
        console.log(`Skipped existing: ${item.dateStr} | ₹${item.amount} | ${item.reason}`);
      }
    }

    console.log(`\nDone! Successfully verified/inserted ${insertedCount} transactions.`);
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();
