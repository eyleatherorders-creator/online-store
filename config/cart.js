
import { allOrders, cart, setAllOrders,inventoryRows,stores,setStores } from "./state.js";
import { getCurrentUser, getCurrentUserEmail, saveToFirebase, saveUserStore } from "../js/firebase.js";
import { getProductPrice } from "./rules.js";
import { createRivhitTestPaymentUrl } from "./rivhitPayment.js";

function addToCart(index) {
    console.log(index)
  let line = inventoryRows.find(row => row.catalogNumber === index) || virtualProducts[virtualProducts.length - 1];
  let existingItemIndex = cart.findIndex(item => item[0].catalogNumber === index);

  if (existingItemIndex > -1) {
    cart[existingItemIndex][1] += 1;
  } else {
    cart.push([line, 1]);
    renderProductCartToggle(index,true);
  }
  showToast("הפריט נוסף לעגלה! ");
  console.log(getCartQuantity(index))
  updateCart();
}

function renderProductCartToggle(catalog, bool){
  let container = document.getElementById(catalog);
  if (!container) return;

  let existing = cart.findIndex(item => item[0].catalogNumber === catalog)
  if(bool){
    container.innerHTML = `
      <div class="w-full mt-auto flex items-center justify-between border border-black rounded overflow-hidden">
            <button onclick="event.stopPropagation(); changeQty('${catalog}',+1);"
              class="bg-gray-100 text-black px-4 py-2 hover:bg-gray-200 font-bold transition-colors">
              +
            </button>
            <span class="font-bold text-lg">${getCartQuantity(catalog)}</span>
            <button onclick="event.stopPropagation(); changeQty('${catalog}',-1);"
              class="bg-gray-100 text-black px-4 py-2 hover:bg-gray-200 font-bold transition-colors">
              -
            </button>
          </div>
    `
  }else{
    container.innerHTML = `
      <button onclick="event.stopPropagation();addToCart('${catalog}') "
          class="w-full mt-auto bg-black text-white py-2 rounded hover:bg-gray-800 transition-colors">
          להזמין
        </button>
    `
  }
}

function changeQty(catalog,delta){
  const container = document.getElementById('cartItems');
  console.log(cart,catalog)
  let itemdIndex = cart.findIndex(item => item[0].catalogNumber === catalog)
  console.log(itemdIndex,cart[itemdIndex][1])
  cart[itemdIndex][1]+= delta
  if (cart[itemdIndex] && cart[itemdIndex][1] === 0) {
    cart.splice(itemdIndex, 1);
    renderProductCartToggle(catalog,false);
  }else{
    renderProductCartToggle(catalog,true)
  }
  
  updateCart()

}

function getCartQuantity(catalogNumber) {
  const found = cart.find(item => item[0].catalogNumber === catalogNumber);
  return found ? found[1] : 0;
}

function getCartTotal() {
  return cart.reduce((total, item) => {
    return total + (getProductPrice(item[0]) * item[1]);
  }, 0);
}

function updateCart() {
  document.getElementById('cartCount').innerText = cart.length;
  const container = document.getElementById('cartItems');
  container.innerHTML = '';

  cart.forEach(item => {
    console.log(item)
    const div = document.createElement('div');
    div.innerHTML=`<div class="flex justify-between items-center mb-2">
        <span class="font-semibold">${item[0].name }</span>
        
      </div>

    <div class="flex items-center justify-between">

        <div class="flex items-center gap-2">
          <button onclick="changeQty('${item[0].catalogNumber}', -1)"
            class="bg-gray-300 px-2 rounded">−</button>

          <span>${item[1]}</span>

          <button onclick="changeQty('${item[0].catalogNumber}', 1)"
            class="bg-gray-300 px-2 rounded">+</button>
        </div>

         <span class="font-semibold">
            ${getProductPrice(item[0]) * item[1]} ₪
          </span>

        <button onclick="changeQty('${item[0].catalogNumber}', ${-item[1]})"
          class="text-red-600 font-bold">🗑</button>
      </div>`
    // div.className = 'border p-2 rounded';
    // div.textContent = item[0].name 
    // div.textContent += " "+item[1];
    // div.textContent += " " + item[0].price
    container.appendChild(div);
  });
}

function toggleCart() {
  document.getElementById('cart').classList.toggle('translate-x-full');
  updateSelectedStoreDisplay();
}

function getCurrentStoreName({ silent = true } = {}) {
  const existing = document.getElementById("storeSelect")?.value || "";
  const newStore = document.getElementById("newStoreInput")?.value.trim() || "";
  const finalStore = existing || newStore;

  if (!finalStore && !silent) {
    alert("חובה לבחור או להקליד חנות");
  }

  return finalStore;
}

function setStoreDisplay(element, storeName) {
  if (!element) return;

  if (!storeName) {
    element.textContent = "";
    element.classList.add("hidden");
    return;
  }

  element.textContent = `חנות נבחרה: ${storeName}`;
  element.classList.remove("hidden");
}

function updateSelectedStoreDisplay() {
  const storeName = getCurrentStoreName();

  setStoreDisplay(document.getElementById("headerSelectedStore"), storeName);
  setStoreDisplay(document.getElementById("cartSelectedStore"), storeName);
}

function initStoreDetailsSync() {
  const storeSelect = document.getElementById("storeSelect");
  const newStoreInput = document.getElementById("newStoreInput");

  storeSelect?.addEventListener("change", () => {
    if (storeSelect.value && newStoreInput) {
      newStoreInput.value = "";
    }

    updateSelectedStoreDisplay();
  });

  newStoreInput?.addEventListener("input", () => {
    updateSelectedStoreDisplay();
  });

  updateSelectedStoreDisplay();
}

function openStoreModal() {
  const modal = document.getElementById("storeModal");
  if (!modal) return;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeStoreModal() {
  const modal = document.getElementById("storeModal");
  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

async function saveStoreDetails() {
  const storeSelect = document.getElementById("storeSelect");
  const newStoreInput = document.getElementById("newStoreInput");
  const selectedStore = storeSelect?.value || "";
  const newStore = newStoreInput?.value.trim() || "";
  const finalStore = newStore || selectedStore;

  if (!finalStore) {
    alert("יש לבחור חנות או להקליד חנות חדשה.");
    return;
  }

  if (newStore) {
    const saved = await saveUserStore(newStore);
    if (!saved) return;

    if (storeSelect) {
      storeSelect.value = newStore;
    }
  }

  updateSelectedStoreDisplay();
  showToast("פרטי החנות נשמרו");
  closeStoreModal();
}

function buildOrderFromCart() {
          
    return Object.values(cart).map(item => ({
      name:item[0].name,
      size: "",
      nusach: "",
      bookNote: item[0]?.factoryIds?.[0]?.toString() ?? "",
      nameIngrave: "",
      nameIngraveType: "",
      styles: [
        {
          color: "",
          style: "",
          amount: item[1]
        }
      ]
    }));
  }

function getSelectedStore() {
  return getCurrentStoreName({ silent: false }) || null;
}

function validateCheckout(paymentMethod = "store") {
  if (cart.length === 0) {
    alert("העגלה ריקה");
    return null;
  }

  if (paymentMethod === "payNow") {
    return "הזמנה באתר";
  }

  if (!getCurrentUser()) {
    alert("כדי להמשיך לאישור ההזמנה יש להתחבר תחילה.");
    return null;
  }

  const storeName = getSelectedStore();
  if (!storeName) return null;

  return storeName;
}

async function openRivhitTestPayment(orderEntry) {
  try {
    const paymentUrl = await createRivhitTestPaymentUrl(
      orderEntry,
      cart,
      getProductPrice
    );

    window.location.href = paymentUrl;
  } catch (error) {
    console.error("Rivhit payment error:", error);
    alert(error?.message || "לא ניתן לפתוח את עמוד התשלום כרגע. בדוק את הגדרת ריווחית ונסה שוב.");
  }
}

function legacyRedirectToRivhitPayment(orderEntry) {
  const paymentUrl = window.RIVHIT_PAYMENT_URL || RIVHIT_PAYMENT_URL;

  if (!paymentUrl) {
    alert("עמוד התשלום המאובטח של ריווחית עדיין לא הוגדר באתר. לאחר קבלת הקישור או החיבור מריווחית יש להזין אותו בקוד.");
    return;
  }

  const url = new URL(paymentUrl, window.location.href);
  url.searchParams.set("orderId", orderEntry.orderId);
  url.searchParams.set("amount", String(orderEntry.total));

  window.location.href = url.toString();
}

async function submitOrder(paymentMethod = "store") {
  const storeName = validateCheckout(paymentMethod);
  if (!storeName) return;

  const customer = buildCustomerForOrder();
  const orderItems = buildOrderFromCart();

  if (orderItems.length === 0) {
    alert("העגלה ריקה");
    return;
  }

  // 1. Prepare the data object for this specific order
  const newOrderEntry = {
    orderId: "ORD-" + Date.now(), // Unique ID based on timestamp
    date: new Date().toISOString(),
    store: storeName,
    customer: customer,
    items: orderItems,
    total: getCartTotal(),
    paymentMethod,
    paymentStatus: paymentMethod === "payNow" ? "awaiting_payment" : "pay_at_store",
    status: "pending" // Default status for your admin panel to manage later
  };

  try {

    
    setAllOrders([newOrderEntry, ...allOrders]);;
    console.log(allOrders,"full")
    // WRITE: Overwrite the doc with the updated array
     const saved = await saveToFirebase(allOrders, storeName);
     if (!saved) {
      if (paymentMethod === "payNow") {
        console.warn("Order was not saved before payment, continuing to payment page for approval flow.");
        await openRivhitTestPayment(newOrderEntry);
        return;
      }

      alert("שגיאה בשליחת ההזמנה");
      return;
     }

     if (paymentMethod === "payNow") {
      await openRivhitTestPayment(newOrderEntry);
      return;
     }

        alert("ההזמנה נשלחה בהצלחה ✅");
        // clearCart();
        // Reset UI
        cart.forEach(item => {
          renderProductCartToggle(item[0].catalogNumber,false)
        })
        cart.length = 0;
        updateCart();
        toggleCart();
    

      } catch (err) {
        console.error(err);
        alert("שגיאה בשליחת ההזמנה");
      }
  
  
}

 function buildCustomerForOrder() {
      const destination = document.getElementById("customerName")?.value || "";
      const whatsapp = document.getElementById("customerWhatsapp")?.value.trim() || "";
      const contactEmail = document.getElementById("customerEmail")?.value.trim() || "";

      return {
        name: destination,
        number: whatsapp,
        whatsapp,
        email: getCurrentUserEmail(),
        contactEmail,
        note: "",
        delivery: "",
        bookSupply: "eyleather"
      };
    }

export{
    submitOrder,
    buildOrderFromCart,
    toggleCart,
    openStoreModal,
    closeStoreModal,
    saveStoreDetails,
    initStoreDetailsSync,
    updateSelectedStoreDisplay,
    updateCart,
    getCartQuantity,
    changeQty,
    addToCart,
    getSelectedStore
}
