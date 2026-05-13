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
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { setAllOrders ,setStores, stores} from "../config/state.js";
import {getSelectedStore } from "../config/cart.js"

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

    const result = await signInWithPopup(auth, provider);

    console.log("Success!", result.user.email);

    return result;

  } catch (error) {

    console.error(error);

    alert("Error: " + error.message);
  }
}

export async function signOut() {
  try {

    await auth.signOut();

    console.log("Signed out");

  } catch (error) {

    console.error(error);
  }
}

// ===== AUTH STATE WATCHER =====

onAuthStateChanged(auth, (user) => {

  const status = document.getElementById("user-status");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");

  // Make sure elements exist
  if (!status || !loginBtn || !logoutBtn) return;

  if (user) {

    status.innerText = "Logged in as: " + user.email;

    loginBtn.style.display = "none";
    logoutBtn.style.display = "block";

    console.log("Ready to fetch prices for:", user.email);

  } else {

    status.innerText = "Logged out.";

    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
  }
});

// ===== LOAD INVENTORY =====

export async function loadUnifiedInventory() {

  try {

    const ref = doc(db, "inventory", "unified");

    const orderDocRef = doc(db, "orders", "all");

    // LOAD ORDERS
    const snap1 = await getDoc(orderDocRef);

    if (snap1.exists()) {

      const data = snap1.data().list || [];

      setAllOrders(data);

      console.log(
        "Loaded existing orders:",
        data.length
      );
    }

    // LOAD INVENTORY
    const snap = await getDoc(ref);

    return snap.exists()
      ? snap.data().rows || []
      : [];

  } catch (error) {

    console.error("Firestore Error:", error);

    return [];
  }
}

// ===== SAVE ORDERS =====

export async function saveToFirebase(updatedArray) {
    const storeName = getSelectedStore();
    if (!storeName) return;
    if (document.getElementById("newStoreInput").value.trim()) {
        const newName = storeName;
    
        if (!stores.find(s => s.name === newName)) {
        setStores([...stores, { name: newName }]);
    
        await setDoc(doc(db, "meta", "stores"), {
            list: stores
        });
        }
    }
  try {

    const orderDocRef = doc(db, "orders", "all");

    await setDoc(orderDocRef, {
      list: updatedArray
    });

    console.log("Firebase sync complete.");

  } catch (e) {

    console.error("Save Error:", e);
  }
}

export async function loadStores() {
  const ref = doc(db, "meta", "stores");
  const snap = await getDoc(ref);

  return snap.exists() ? snap.data().list || [] : [];
}

export async function initStores() {
  const data = await loadStores();
  setStores(data)

  const select = document.getElementById("storeSelect");
  select.innerHTML = `<option value="">בחר חנות קיימת</option>`;

  stores.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.name;
    opt.textContent = s.name;
    select.appendChild(opt);
  });
}
