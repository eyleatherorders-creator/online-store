import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyA8VhIFlBuduLwvwDEUY3lV5oIuQ71QAO0",
    authDomain: "tasking-bfc1d.firebaseapp.com",
    projectId: "tasking-bfc1d",
    storageBucket: "tasking-bfc1d.firebasestorage.app",
    messagingSenderId: "18244313186",
    appId: "1:18244313186:web:3f260f9a29b6b63504b13b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- LOCAL STATIC RULES (UI/Visual Only) ---
const BOOK_TYPE_RULES = [
    { match: ["סידור"], folder: "sidur" },
    { match: ["מחזור"], folder: "mahzor" },
    { match: ["תהלים", "תהילים"], folder: "tehilim" },
    { match: ['תנ"ך', "תנך"], folder: "tanach" }
];

const SKIN_RULES = [{ match: ["ווקטה", "אנטיקו"], gradient: "vachetta" }];
const PLATE_RULES = ["ירושלים", "חגים"];
const COLOR_RULES = [
    { match: ["חום", "בראון"], color: "#5a2d1a" },
    { match: ["בורדו"], color: "#8b1e1e" },
    { match: ["אדום"], color: "#b02a2a" },
    { match: ["כחול", "נייבי"], color: "#1e3a5f" },
    { match: ["ירוק"], color: "#2f6b3c" },
    { match: ["לבן", "שמנת"], color: "#e8e2d8" },
    { match: ["שיש"], color: "#bbab9b" },
    { match: ["קוניאק"], color: "#6f301b" }
];

// --- DYNAMIC DATA (To be filled from Firebase) ---
let CATALOG_RULES = { publisher: [], bookType: [], size: [], color: [], design: [] };
let PRICE_MATRIX = {};
let CATEGORY_PRICES = {};

/**
 * Call this function once when your app starts
 */
async function loadRemoteRules() {
    try {
        // 1. Fetch Catalog Rules
        const rulesSnap = await getDoc(doc(db, "settings", "catalogRules"));
        if (rulesSnap.exists()) CATALOG_RULES = rulesSnap.data();

        // 2. Fetch Price Matrix
        const matrixSnap = await getDoc(doc(db, "settings", "priceMatrix"));
        if (matrixSnap.exists()) PRICE_MATRIX = matrixSnap.data();

        // 3. Fetch Category Base Prices
        const priceSnap = await getDoc(doc(db, "settings", "categoryPrices"));
        if (priceSnap.exists()) CATEGORY_PRICES = priceSnap.data();

        console.log("Remote rules loaded successfully.");
        return true;
    } catch (error) {
        console.error("Error loading remote rules:", error);
        return false;
    }
}

export {
    loadRemoteRules,
    BOOK_TYPE_RULES,
    SKIN_RULES,
    PLATE_RULES,
    COLOR_RULES,
    CATALOG_RULES,
    PRICE_MATRIX,
    CATEGORY_PRICES
};


// pricing.js

import {
  parseCatalogNumber
} from "./catalog.js";

function getRulePrice(rulesArray, code) {

  if (!Array.isArray(rulesArray)) return 0;

  const found = rulesArray.find(
    r => r.code === code
  );

  return Number(found?.price || 0);
}

// function getProductPrice(row) {

//   if (!row?.catalogNumber) return 0;

//   const parts = parseCatalogNumber(
//     row.catalogNumber
//   );

//   const matrixKey =
//     `${parts.publisher}-${parts.bookType}`;

//   let total =
//     Number(PRICE_MATRIX?.[matrixKey] || 0);


//   total += getRulePrice(
//     CATALOG_RULES.size,
//     parts.size
//   );


//   total += getRulePrice(
//     CATALOG_RULES.color,
//     parts.color
//   );

//   total += getRulePrice(
//     CATALOG_RULES.design,
//     parts.design
//   );
  
//   return total;
// }

function getProductPrice(row) {

  if (!row?.catalogNumber) return 0;

  const parts = parseCatalogNumber(
    row.catalogNumber
  );

  // =========================
  // BASE PRICE
  // =========================

  const matrixKey =
    `${parts.publisher}-${parts.bookType}`;

  const basePrice =
    Number(PRICE_MATRIX?.[matrixKey] || 0);

  // =========================
  // AMOUNT
  // =========================

  const bookTypeRule =
    CATALOG_RULES.bookType.find(
      r => r.code === parts.bookType
    );

  const amount =
    Number(bookTypeRule?.amount || 1);

  // =========================
  // MODIFIERS
  // =========================

  const sizePrice =
    getRulePrice(
      CATALOG_RULES.size,
      parts.size
    );

  const colorPrice =
    getRulePrice(
      CATALOG_RULES.color,
      parts.color
    );

  const designPrice =
    getRulePrice(
      CATALOG_RULES.design,
      parts.design
    );

  // =========================
  // TOTAL
  // =========================

  const total =
    basePrice +
    (
      sizePrice +
      colorPrice +
      designPrice
    ) * amount;

  return Number(total || 0);
}

export {
  getProductPrice
};