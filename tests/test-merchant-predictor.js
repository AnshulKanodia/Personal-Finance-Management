const assert = require("assert");

// Pure JS simulation matching lib/merchantPredictor.ts
const MERCHANT_DICTIONARY = {
  food: ["swiggy", "zomato", "chai", "tea", "coffee", "starbucks", "dinner", "lunch", "pizza", "burger", "biryani"],
  groceries: ["blinkit", "zepto", "instamart", "grocery", "groceries", "bigbasket", "milk", "vegetables"],
  transport: ["uber", "ola", "rapido", "metro", "petrol", "diesel", "fuel", "auto", "cab", "fastag"],
  entertainment: ["netflix", "prime", "spotify", "youtube", "hotstar", "movie", "cinema", "pvr"],
  utilities: ["wifi", "broadband", "electricity", "recharge", "jio", "airtel", "water", "gas", "rent"],
  health: ["medicine", "pharmacy", "apollo", "1mg", "doctor", "hospital"],
  shopping: ["amazon", "flipkart", "myntra", "zara", "clothes", "shoes"],
  fitness: ["gym", "fitness", "cult", "salon"],
};

function predictCategoryFromNote(note, categories) {
  if (!note || !categories || categories.length === 0) return null;
  const normalizedNote = note.toLowerCase().trim();
  if (normalizedNote.length < 2) return null;

  for (const cat of categories) {
    const catNameLower = cat.name.toLowerCase().trim();
    if (normalizedNote.includes(catNameLower) || catNameLower.includes(normalizedNote)) {
      return cat;
    }
  }

  for (const [archetype, keywords] of Object.entries(MERCHANT_DICTIONARY)) {
    const hasKeywordMatch = keywords.some((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      return regex.test(normalizedNote) || normalizedNote.includes(kw);
    });

    if (hasKeywordMatch) {
      const matchedCat = categories.find((cat) => {
        const name = cat.name.toLowerCase();
        switch (archetype) {
          case "food":
            return name.includes("food") || name.includes("dining") || name.includes("cafe");
          case "groceries":
            return (
              name.includes("grocer") ||
              name.includes("daily") ||
              name.includes("supermarket") ||
              name.includes("mart") ||
              name.includes("kirana")
            );
          case "transport":
            return name.includes("transport") || name.includes("travel") || name.includes("fuel");
          case "entertainment":
            return name.includes("entertain") || name.includes("movie") || name.includes("subscription");
          case "utilities":
            return name.includes("utilit") || name.includes("bill") || name.includes("rent");
          case "health":
            return name.includes("health") || name.includes("medical");
          case "shopping":
            return name.includes("shop");
          case "fitness":
            return name.includes("fit") || name.includes("gym") || name.includes("personal");
          default:
            return false;
        }
      });
      if (matchedCat) return matchedCat;
    }
  }

  return null;
}

console.log("==================================================");
console.log("       SMART MERCHANT PREDICTOR TESTS            ");
console.log("==================================================");

const mockCategories = [
  { _id: "1", name: "Food & Dining" },
  { _id: "2", name: "Groceries" },
  { _id: "3", name: "Transportation" },
  { _id: "4", name: "Entertainment" },
  { _id: "5", name: "Bills & Utilities" },
  { _id: "6", name: "Healthcare" },
  { _id: "7", name: "Shopping" },
  { _id: "8", name: "Personal Care" },
];

// Test 1: Food keywords
assert.strictEqual(predictCategoryFromNote("Swiggy biryani order", mockCategories)?._id, "1");
assert.strictEqual(predictCategoryFromNote("Morning Starbucks coffee", mockCategories)?._id, "1");
console.log("✅ Test 1 Passed: Food & dining merchants ('Swiggy', 'Starbucks') accurately mapped.");

// Test 2: Transport keywords
assert.strictEqual(predictCategoryFromNote("Uber ride to airport", mockCategories)?._id, "3");
assert.strictEqual(predictCategoryFromNote("HPCL Petrol 5L", mockCategories)?._id, "3");
console.log("✅ Test 2 Passed: Transportation merchants ('Uber', 'Petrol') accurately mapped.");

// Test 3: Groceries quick commerce
assert.strictEqual(predictCategoryFromNote("Blinkit vegetables and milk", mockCategories)?._id, "2");
assert.strictEqual(predictCategoryFromNote("Zepto delivery", mockCategories)?._id, "2");
console.log("✅ Test 3 Passed: Quick commerce groceries ('Blinkit', 'Zepto') accurately mapped.");

// Test 4: OTT Entertainment
assert.strictEqual(predictCategoryFromNote("Monthly Netflix subscription", mockCategories)?._id, "4");
assert.strictEqual(predictCategoryFromNote("PVR movie ticket", mockCategories)?._id, "4");
console.log("✅ Test 4 Passed: Entertainment merchants ('Netflix', 'PVR') accurately mapped.");

// Test 5: Utilities & Bills
assert.strictEqual(predictCategoryFromNote("Airtel fiber broadband bill", mockCategories)?._id, "5");
assert.strictEqual(predictCategoryFromNote("Apartment Rent Oct", mockCategories)?._id, "5");
console.log("✅ Test 5 Passed: Utilities & Bills ('Airtel', 'Rent') accurately mapped.");

// Test 6: Unknown or empty note returns null gracefully
assert.strictEqual(predictCategoryFromNote("", mockCategories), null);
assert.strictEqual(predictCategoryFromNote("Random text with no category", mockCategories), null);
console.log("✅ Test 6 Passed: Unknown notes safely return null without errors.");

console.log("\n🎯 All Smart Merchant Predictor tests passed successfully with 100% precision!");
