/**
 * Test suite for RupeePulse Backup & Restore payload schema and integrity
 */
const assert = require("assert");

function validateBackupPayload(backup) {
  assert.ok(backup, "Backup object must exist");
  assert.strictEqual(backup.app, "RupeePulse", "App name must be RupeePulse");
  assert.ok(backup.format.startsWith("RupeePulse-Vault-Backup"), "Format must be RupeePulse-Vault-Backup");
  assert.ok(backup.counts, "Counts object must exist");
  assert.ok(backup.data, "Data object must exist");
  assert.ok(Array.isArray(backup.data.categories), "Categories must be an array");
  assert.ok(Array.isArray(backup.data.friends), "Friends must be an array");
  assert.ok(Array.isArray(backup.data.friendDues), "FriendDues must be an array");
  assert.ok(Array.isArray(backup.data.transactions), "Transactions must be an array");
  return true;
}

function testSampleValidation() {
  const sample = {
    app: "RupeePulse",
    version: "1.4.0",
    format: "RupeePulse-Vault-Backup-v1",
    exportedAt: new Date().toISOString(),
    counts: {
      categories: 2,
      friends: 1,
      friendDues: 1,
      transactions: 2,
      groups: 0,
    },
    data: {
      categories: [
        { name: "Food & Dining", color: "#f97316", icon: "UtensilsCrossed" },
        { name: "Salary", color: "#10b981", icon: "Briefcase" },
      ],
      friends: [
        { name: "Rahul Sharma", phone: "9876543210" },
      ],
      friendDues: [
        {
          friendId: "6706789abcde1234567890ab",
          amount: 500,
          type: "TO_TAKE",
          isSettled: false,
          notes: "Dinner split",
          date: new Date().toISOString(),
        },
      ],
      transactions: [
        {
          amount: 250,
          type: "EXPENSE",
          paymentMode: "UPI",
          notes: "Pizza party",
          date: new Date().toISOString(),
        },
      ],
      groups: [],
    },
  };

  assert.strictEqual(validateBackupPayload(sample), true);
  console.log("✅ Backup payload schema validation passed successfully.");
}

testSampleValidation();
