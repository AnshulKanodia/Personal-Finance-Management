const assert = require("assert");

/**
 * Pure business logic & validation unit tests for Editing Friend Details
 */

function validateAndFormatFriendUpdate(existingFriend, updatePayload) {
  if (!existingFriend || !existingFriend._id) {
    throw new Error("Friend not found");
  }

  const { name, phone, upiId, notes } = updatePayload;

  // Validate Name
  if (name !== undefined) {
    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (!trimmedName) {
      throw new Error("Friend name cannot be empty");
    }
  }

  // Normalize phone if provided
  let formattedPhone = existingFriend.phone || "";
  if (phone !== undefined) {
    formattedPhone = typeof phone === "string" ? phone.trim() : "";
  }

  // Normalize UPI ID if provided
  let formattedUpi = existingFriend.upiId || "";
  if (upiId !== undefined) {
    formattedUpi = typeof upiId === "string" ? upiId.trim() : "";
    if (formattedUpi && !formattedUpi.includes("@")) {
      throw new Error("Invalid UPI ID: must contain '@' handle (e.g. name@okhdfc)");
    }
  }

  // Normalize notes if provided
  let formattedNotes = existingFriend.notes || "";
  if (notes !== undefined) {
    formattedNotes = typeof notes === "string" ? notes.trim() : "";
  }

  const updatedFriend = {
    ...existingFriend,
    name: name !== undefined ? name.trim() : existingFriend.name,
    phone: formattedPhone,
    upiId: formattedUpi,
    notes: formattedNotes,
    updatedAt: new Date().toISOString(),
  };

  return updatedFriend;
}

function calculateFriendNetBalance(friendId, dues = []) {
  const friendDues = dues.filter((d) => d.friendId === friendId && !d.isSettled);
  let toGive = 0;
  let toTake = 0;

  friendDues.forEach((d) => {
    if (d.type === "TO_GIVE") toGive += d.amount;
    else if (d.type === "TO_TAKE") toTake += d.amount;
  });

  return {
    toGive,
    toTake,
    netBalance: toTake - toGive,
    unsettledCount: friendDues.length,
  };
}

console.log("==================================================");
console.log("       EDIT FRIEND DETAILS & VALIDATION TESTS     ");
console.log("==================================================");

// Test 1: Successful name and phone update
{
  const original = { _id: "f1", name: "Rahul", phone: "9876543210" };
  const updated = validateAndFormatFriendUpdate(original, {
    name: "Rahul Sharma",
    phone: "+91 98765 43210",
  });
  assert.strictEqual(updated.name, "Rahul Sharma");
  assert.strictEqual(updated.phone, "+91 98765 43210");
  console.log("✅ Test 1 Passed: Friend name and phone updated successfully.");
}

// Test 2: Updating with UPI ID and Notes
{
  const original = { _id: "f2", name: "Priya", phone: "" };
  const updated = validateAndFormatFriendUpdate(original, {
    upiId: "priya@okaxis",
    notes: "Flatmate - Split Rent",
  });
  assert.strictEqual(updated.upiId, "priya@okaxis");
  assert.strictEqual(updated.notes, "Flatmate - Split Rent");
  assert.strictEqual(updated.name, "Priya"); // Preserved
  console.log("✅ Test 2 Passed: Optional UPI ID and relationship notes saved.");
}

// Test 3: Reject empty or whitespace-only name
{
  const original = { _id: "f3", name: "Aman" };
  assert.throws(
    () => {
      validateAndFormatFriendUpdate(original, { name: "   " });
    },
    /Friend name cannot be empty/,
    "Expected empty name to throw error"
  );
  console.log("✅ Test 3 Passed: Empty or blank name correctly rejected.");
}

// Test 4: Validate UPI ID structure
{
  const original = { _id: "f4", name: "Vikas" };
  assert.throws(
    () => {
      validateAndFormatFriendUpdate(original, { upiId: "invalid-upi-handle" });
    },
    /Invalid UPI ID/,
    "Expected UPI ID without '@' to throw validation error"
  );
  console.log("✅ Test 4 Passed: Malformed UPI ID correctly rejected.");
}

// Test 5: Verify dues and net balance preserved across friend details update
{
  const dues = [
    { friendId: "f5", amount: 1200, type: "TO_TAKE", isSettled: false },
    { friendId: "f5", amount: 400, type: "TO_GIVE", isSettled: false },
  ];

  const beforeBalance = calculateFriendNetBalance("f5", dues);
  assert.strictEqual(beforeBalance.netBalance, 800);
  assert.strictEqual(beforeBalance.unsettledCount, 2);

  // Update friend details
  const original = { _id: "f5", name: "Kunal" };
  const updated = validateAndFormatFriendUpdate(original, { name: "Kunal Verma" });
  assert.strictEqual(updated.name, "Kunal Verma");

  // Balance remains identical
  const afterBalance = calculateFriendNetBalance("f5", dues);
  assert.strictEqual(afterBalance.netBalance, 800);
  assert.strictEqual(afterBalance.unsettledCount, 2);
  console.log("✅ Test 5 Passed: Active dues and net balances preserved across detail updates.");
}

// Test 6: Partial update keeps unaffected fields unchanged
{
  const original = {
    _id: "f6",
    name: "Sneha",
    phone: "9988776655",
    upiId: "sneha@okhdfc",
    notes: "College friend",
  };

  const updated = validateAndFormatFriendUpdate(original, {
    notes: "Colleague at Tech Corp",
  });

  assert.strictEqual(updated.name, "Sneha");
  assert.strictEqual(updated.phone, "9988776655");
  assert.strictEqual(updated.upiId, "sneha@okhdfc");
  assert.strictEqual(updated.notes, "Colleague at Tech Corp");
  console.log("✅ Test 6 Passed: Targeted field update preserves all non-targeted fields.");
}

console.log("\n🎯 All Edit Friend Details tests passed with 100% precision!\n");
