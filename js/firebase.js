// Use the same version for all Firebase imports (10.8.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { setAllOrders ,setStores, stores} from "../config/state.js";

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyA8VhIFlBuduLwvwDEUY3lV5oIuQ71QAO0",
  authDomain: "tasking-bfc1d.firebaseapp.com",
  projectId: "tasking-bfc1d",
  storageBucket: "tasking-bfc1d.firebasestorage.app",
  messagingSenderId: "18244313186",
  appId: "1:18244313186:web:3f260f9a29b6b63504b13b"
};

// ===== INITIALIZE =====
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

// ===== AUTH FUNCTIONS =====

export async function signIn() {

  try {

    const result =
      await signInWithPopup(auth, provider);

    const user = result.user;

    console.log("Logged in:", user.email);

    return user;

  } catch (error) {

    console.error(error);

    alert("ההתחברות נכשלה. נסה שוב.");
  }
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function getCurrentUserEmail() {
  return auth.currentUser?.email || "";
}

export async function saveUserStore(storeName) {
  const user = auth.currentUser;
  const newName = String(storeName || "").trim();

  if (!user) {
    alert("כדי לשמור חנות יש להתחבר תחילה.");
    return false;
  }

  if (!newName) {
    alert("יש להקליד שם חנות.");
    return false;
  }

  const currentStores =
    Array.isArray(stores)
      ? stores
      : [];

  const exists = currentStores.find(s => s.name === newName);

  if (exists) {
    return true;
  }

  const updatedStores = [
    ...currentStores,
    { name: newName }
  ];

  setStores(updatedStores);

  await setDoc(
    doc(db, "usersWebsite", user.uid),
    {
      stores: updatedStores
    },
    { merge: true }
  );

  renderStoreSelect(updatedStores);
  return true;
}


// ========================
// SIGN OUT
// ========================

export async function signOut() {

  try {

    await firebaseSignOut(auth);

    console.log("Signed out");

  } catch (error) {

    console.error(error);
  }
}
// ========================
// AUTH LISTENER
// ========================

export function initAuth() {

  onAuthStateChanged(auth, async (user) => {

    const loginBtn =
      document.getElementById("loginBtn");

    const userBox =
      document.getElementById("userBox");

    const userName =
      document.getElementById("userName");

    // ----------------
    // LOGGED IN
    // ----------------
    if (user) {

      loginBtn?.classList.add("hidden");

      userBox?.classList.remove("hidden");

      userName.innerText =
        user.displayName || user.email;

      // load user stores
      await loadUserStores(user.uid);

    }

    // ----------------
    // LOGGED OUT
    // ----------------
    else {

      loginBtn?.classList.remove("hidden");

      userBox?.classList.add("hidden");

      setStores([]);

      renderStoreSelect([]);
    }

  });

}


// ========================
// LOAD STORES
// ========================

async function loadUserStores(uid) {
  console.log("🔍 Loading user stores for UID:", uid);
  try {

    const ref = doc(db, "usersWebsite", uid);

    const snap = await getDoc(ref);

    if (!snap.exists()) {

      setStores([]);

      renderStoreSelect([]);

      return;
    }

    const data = snap.data();

    const stores = data.stores || [];
    console.log("🔍 User stores loaded:", stores);
    setStores(stores);

    renderStoreSelect(stores);

  } catch (err) {

    console.error(err);
  }
}


// ========================
// RENDER STORE SELECT
// ========================

function renderStoreSelect(stores) {

  const select =
    document.getElementById("storeSelect");

  if (!select) return;

  select.innerHTML =
    `<option value="">בחר חנות קיימת</option>`;

  stores.forEach(store => {

    const option =
      document.createElement("option");

    option.value = store.name;

    option.innerText = store.name;

    select.appendChild(option);

  });

  window.updateSelectedStoreDisplay?.();

}


// ===== LOAD INVENTORY =====

export async function loadUnifiedInventory() {
  try {
    // const inventoryRef = doc(db, "inventory", "unified");
    const orderDocRef = doc(db, "orders", "all");

    console.log("⏳ Initiating parallel Firebase fetch for Inventory and Orders...");

    // THE FIX: Trigger BOTH network requests simultaneously in parallel
    const [ordersSnap] = await Promise.all([
      getDoc(orderDocRef),
      // getDoc(inventoryRef)
    ]);

    // 1. Process Orders data safely in memory
    if (ordersSnap.exists()) {
      const ordersData = ordersSnap.data().list || [];
      setAllOrders(ordersData);
      console.log("📋 Parallel Load: Existing orders synced successfully:", ordersData.length);
    } else {
      console.warn("⚠️ Orders document ('orders/all') does not exist in Firestore.");
      setAllOrders([]); // Fallback to safe state
    }

    // 2. Process and return Inventory rows cleanly
    // if (inventorySnap.exists()) {
    //   const inventoryRows = inventorySnap.data().rows || [];
    //   console.log("📦 Parallel Load: Inventory rows retrieved successfully:", inventoryRows.length);
    //   return inventoryRows; // Hand this directly back to app.js Stage 5
    // } else {
    //   console.warn("⚠️ Inventory document ('inventory/unified') does not exist in Firestore.");
    //   return [];
    // }
    const inventoryRows = await loadData();
    if (inventoryRows.length > 0) {
      console.log("📦 Parallel Load: Inventory rows retrieved successfully:", inventoryRows.length);
      return inventoryRows
    }else{
      alert("לא ניתן לטעון את המוצרים כרגע. אנא פנה לתמיכה.")
      return [];
    }

  } catch (error) {
    console.error("💥 Critical Firestore Fetch Error within parallel handler:", error);
    return []; // Return empty array so the main app.js execution loop never freezes
  }
}


async function loadData() {
  const versionInfo = await fetch("https://pub-a13b8a47547b45c99e66f1e0a5133f58.r2.dev/version.json",
    {
      cache: "no-store"
    }
  ).then(r => r.json());

  const data = await fetch(`https://pub-a13b8a47547b45c99e66f1e0a5133f58.r2.dev/${versionInfo.latest}`,
  ).then(r => r.json());
  return data
}

// ===== SAVE ORDERS =====

export async function saveToFirebase(updatedArray, storeName = "") {
    const currentStores =
    Array.isArray(stores)
      ? stores
      : [];
    if (!storeName) return false;
    if (document.getElementById("newStoreInput")?.value.trim()) {

        const user = auth.currentUser;

        if (!user) {
          alert("כדי להמשיך לאישור ההזמנה יש להתחבר תחילה.");
          return false;
        }

        const newName = storeName.trim();

        const exists =
          currentStores.find(
            s => s.name === newName
          );

        if (!exists) {

          const updatedStores = [
            ...currentStores,
            { name: newName }
          ];

          // update local state
          setStores(updatedStores);

          // save to user document
          await setDoc(
            doc(db, "usersWebsite", user.uid),
            {
              stores: updatedStores
            },
            { merge: true }
          );

          console.log("Store saved to user");
        }
    }
  try {

    const orderDocRef = doc(db, "orders", "all");

    await setDoc(orderDocRef, {
      list: updatedArray
    });

    console.log("Firebase sync complete.");
    return true;

  } catch (e) {

    console.error("Save Error:", e);
    return false;
  }
}

export async function loadStores() {
  const ref = doc(db, "meta", "stores");
  const snap = await getDoc(ref);

  return snap.exists() ? snap.data().list || [] : [];
}

export async function initStores() {

  const data = await loadUserStores();

  setStores(data);

  const select =
    document.getElementById("storeSelect");

  select.innerHTML =
    `<option value="">בחר חנות קיימת</option>`;

  data.forEach(s => {

    const opt =
      document.createElement("option");

    opt.value = s.name;

    opt.textContent = s.name;

    select.appendChild(opt);

  });

}

window.signIn = signIn;
window.signOut = signOut;
