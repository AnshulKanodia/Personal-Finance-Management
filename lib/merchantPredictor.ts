export interface PredictableCategory {
  _id: string;
  name: string;
  color?: string;
  icon?: string;
}

// Comprehensive dictionary mapping popular Indian & global merchants/expenses to category archetypes
const MERCHANT_DICTIONARY: Record<string, string[]> = {
  // Food & Dining
  food: [
    "swiggy",
    "zomato",
    "chai",
    "tea",
    "coffee",
    "starbucks",
    "cafe",
    "dinner",
    "lunch",
    "breakfast",
    "pizza",
    "burger",
    "mcdonalds",
    "dominos",
    "kfc",
    "subway",
    "biryani",
    "restaurant",
    "dhaba",
    "bakery",
    "snacks",
    "dessert",
    "ice cream",
    "barbeque",
    "haldiram",
    "dosa",
    "samosa",
  ],
  // Groceries & Daily Needs
  groceries: [
    "blinkit",
    "zepto",
    "instamart",
    "grocery",
    "groceries",
    "bigbasket",
    "supermarket",
    "vegetables",
    "veggies",
    "fruits",
    "milk",
    "dairy",
    "dmart",
    "d-mart",
    "ration",
    "kirana",
    "spencer",
    "nature basket",
  ],
  // Transportation & Commute
  transport: [
    "uber",
    "ola",
    "rapido",
    "metro",
    "petrol",
    "diesel",
    "fuel",
    "auto",
    "cab",
    "taxi",
    "parking",
    "toll",
    "fastag",
    "flight",
    "air india",
    "indigo",
    "train",
    "irctc",
    "bus",
    "redbus",
    "yulu",
    "rickshaw",
    "ev charging",
  ],
  // Entertainment & OTT
  entertainment: [
    "netflix",
    "prime",
    "spotify",
    "youtube",
    "hotstar",
    "movie",
    "cinema",
    "pvr",
    "inox",
    "bookmyshow",
    "disney",
    "game",
    "steam",
    "playstation",
    "xbox",
    "theatre",
    "concert",
    "club",
  ],
  // Bills, Utilities & Housing
  utilities: [
    "wifi",
    "broadband",
    "electricity",
    "power",
    "recharge",
    "jio",
    "airtel",
    "vi",
    "water",
    "gas",
    "cylinder",
    "indane",
    "hp gas",
    "bharat gas",
    "bill",
    "maintenance",
    "rent",
    "landlord",
    "dth",
    "tata play",
  ],
  // Healthcare & Wellness
  health: [
    "medicine",
    "pharmacy",
    "apollo",
    "1mg",
    "pharmeasy",
    "doctor",
    "hospital",
    "clinic",
    "dentist",
    "lab",
    "blood test",
    "tablets",
    "meds",
    "therapy",
  ],
  // Shopping & Lifestyle
  shopping: [
    "amazon",
    "flipkart",
    "myntra",
    "zara",
    "h&m",
    "clothes",
    "clothing",
    "shopping",
    "shoes",
    "electronics",
    "meesho",
    "nykaa",
    "ajio",
    "croma",
    "reliance digital",
    "mall",
  ],
  // Personal Care & Fitness
  fitness: [
    "gym",
    "fitness",
    "cult",
    "salon",
    "haircut",
    "barber",
    "spa",
    "massage",
    "grooming",
    "cosmetics",
  ],
  // Investment & Wealth
  investment: [
    "zerodha",
    "groww",
    "sip",
    "mutual fund",
    "stocks",
    "crypto",
    "fd",
    "fixed deposit",
    "gold",
    "shares",
    "etf",
  ],
  // Education & Learning
  education: [
    "books",
    "course",
    "udemy",
    "coursera",
    "tuition",
    "school",
    "college",
    "fees",
    "exam",
    "stationery",
  ],
};

/**
 * Predicts the most suitable category given a user's transaction note / merchant name.
 * Returns the matching category from the user's available categories list, or null if no match.
 */
export function predictCategoryFromNote<T extends PredictableCategory>(
  note: string,
  categories: T[]
): T | null {
  if (!note || !categories || categories.length === 0) return null;

  const normalizedNote = note.toLowerCase().trim();
  if (normalizedNote.length < 2) return null;

  // 1. Direct name match: if the note contains the exact category name
  for (const cat of categories) {
    const catNameLower = cat.name.toLowerCase().trim();
    if (normalizedNote.includes(catNameLower) || catNameLower.includes(normalizedNote)) {
      return cat;
    }
  }

  // 2. Dictionary match against category archetypes
  for (const [archetype, keywords] of Object.entries(MERCHANT_DICTIONARY)) {
    const hasKeywordMatch = keywords.some((kw) => {
      // Word boundary or substring match
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      return regex.test(normalizedNote) || normalizedNote.includes(kw);
    });

    if (hasKeywordMatch) {
      // Find a category in the user's list that corresponds to this archetype
      const matchedCat = categories.find((cat) => {
        const name = cat.name.toLowerCase();
        switch (archetype) {
          case "food":
            return name.includes("food") || name.includes("dining") || name.includes("cafe") || name.includes("restaurant");
          case "groceries":
            return (
              name.includes("grocer") ||
              name.includes("daily") ||
              name.includes("supermarket") ||
              name.includes("mart") ||
              name.includes("kirana")
            );
          case "transport":
            return name.includes("transport") || name.includes("travel") || name.includes("commute") || name.includes("cab") || name.includes("fuel");
          case "entertainment":
            return name.includes("entertain") || name.includes("movie") || name.includes("subscription") || name.includes("ott");
          case "utilities":
            return name.includes("utilit") || name.includes("bill") || name.includes("rent") || name.includes("house");
          case "health":
            return name.includes("health") || name.includes("medical") || name.includes("pharmacy") || name.includes("care");
          case "shopping":
            return name.includes("shop") || name.includes("lifestyle") || name.includes("cloth");
          case "fitness":
            return name.includes("fit") || name.includes("gym") || name.includes("personal") || name.includes("care");
          case "investment":
            return name.includes("invest") || name.includes("saving") || name.includes("wealth");
          case "education":
            return name.includes("educat") || name.includes("learn") || name.includes("book") || name.includes("course");
          default:
            return false;
        }
      });

      if (matchedCat) return matchedCat;
    }
  }

  return null;
}
