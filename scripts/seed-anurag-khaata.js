const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in environment");
  process.exit(1);
}

const FriendSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const FriendDueSchema = new mongoose.Schema(
  {
    friendId: { type: mongoose.Schema.Types.ObjectId, ref: "Friend", required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["TO_GIVE", "TO_TAKE"], required: true },
    isSettled: { type: Boolean, default: false },
    paymentMode: { type: String, enum: ["UPI", "CASH"], default: "UPI" },
    notes: { type: String, trim: true, default: "" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Friend = mongoose.models.Friend || mongoose.model("Friend", FriendSchema);
const FriendDue = mongoose.models.FriendDue || mongoose.model("FriendDue", FriendDueSchema);

const ENTRIES = [
  { val: 2500, type: "TO_GIVE", note: "Anurag gave me" },
  { val: 18, type: "TO_GIVE", note: "Anurag gave me" },
  { val: 100, type: "TO_TAKE", note: "Anurag took from me" },
  { val: 335, type: "TO_TAKE", note: "Anurag took from me" },
  { val: 60, type: "TO_GIVE", note: "Anurag gave me" },
  { val: 250, type: "TO_TAKE", note: "Anurag took from me" },
  { val: 250, type: "TO_TAKE", note: "Anurag took from me" },
  { val: 500, type: "TO_TAKE", note: "Anurag took from me" },
  { val: 40, type: "TO_GIVE", note: "Anurag gave me" },
  { val: 1525, type: "TO_TAKE", note: "Anurag took from me" },
  { val: 18, type: "TO_GIVE", note: "Anurag gave me" },
];

async function run() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!");

    // Find or create friend Anurag
    let friend = await Friend.findOne({ name: { $regex: /^Anurag$/i } });
    if (!friend) {
      friend = await Friend.create({ name: "Anurag", phone: "" });
      console.log(`Created friend record: ${friend.name} (${friend._id})`);
    } else {
      console.log(`Found existing friend: ${friend.name} (${friend._id})`);
    }

    // Insert dues
    let toGiveTotal = 0;
    let toTakeTotal = 0;
    let count = 0;

    for (const entry of ENTRIES) {
      await FriendDue.create({
        friendId: friend._id,
        amount: entry.val,
        type: entry.type,
        isSettled: false,
        paymentMode: "UPI",
        notes: entry.note,
        date: new Date(),
      });

      if (entry.type === "TO_GIVE") toGiveTotal += entry.val;
      if (entry.type === "TO_TAKE") toTakeTotal += entry.val;
      count++;
    }

    console.log(`\nSuccessfully added ${count} ledger entries for Anurag:`);
    console.log(`Total Anurag gave me (To Give): ₹${toGiveTotal}`);
    console.log(`Total Anurag took from me (To Take): ₹${toTakeTotal}`);
    console.log(`Net Position: ₹${toTakeTotal - toGiveTotal} (Anurag owes you)`);

    process.exit(0);
  } catch (e) {
    console.error("Error seeding Anurag entries:", e);
    process.exit(1);
  }
}

run();
