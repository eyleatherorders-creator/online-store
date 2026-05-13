
import { allOrders, setAllOrders,inventoryRows,stores,setStores } from "./state.js";
import { saveToFirebase } from "../js/firebase.js";
function addToCart(index) {
    console.log(index)
  let line = inventoryRows.find(row => row.catalogNumber === index) || virtualProducts[virtualProducts.length - 1];
  let existingItemIndex = cart.findIndex(item => item[0].catalogNumber === index);

  if (existingItemIndex > -1) {
    cart[existingItemIndex][1] += 1;
  } else {
    cart.push([line, 1]);
  }
  showToast("הפריט נוסף לעגלה! ");
  console.log(getCartQuantity(index))
  updateCart();
}

function changeQty(catalog,delta){
  const container = document.getElementById('cartItems');
  console.log(cart,catalog)
  let itemdIndex = cart.findIndex(item => item[0].catalogNumber === catalog)
  console.log(itemdIndex,cart[itemdIndex][1])
  cart[itemdIndex][1]+= delta
  if (cart[itemdIndex] && cart[itemdIndex][1] === 0) {
    cart.splice(itemdIndex, 1);
}
  
  updateCart()

}

function getCartQuantity(catalogNumber) {
  const found = cart.find(item => item[0].catalogNumber === catalogNumber);
  return found ? found[1] : 0;
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
            ${
              (Number(
                String(item[0].price ?? 0)
                  .replace("₪", "")
                  .trim()
              ) || 0) * (item[1] || 0)
            } ₪
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
  
  const existing = document.getElementById("storeSelect").value;
  const newStore = document.getElementById("newStoreInput").value.trim();

  const finalStore = existing || newStore;

  if (!finalStore) {
    alert("חובה לבחור או להקליד חנות");
    return null;
  }

  return finalStore;
}

async function submitOrder() {
  const storeName = getSelectedStore();
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
    status: "pending" // Default status for your admin panel to manage later
  };

  try {

    
    setAllOrders([newOrderEntry, ...allOrders]);;
    console.log(allOrders,"full")
    // WRITE: Overwrite the doc with the updated array
     saveToFirebase(allOrders);

        alert("ההזמנה נשלחה בהצלחה ✅");
        // clearCart();
        // Reset UI
        cart = [];
        updateCart();
        toggleCart();
    

      } catch (err) {
        console.error(err);
        alert("שגיאה בשליחת ההזמנה");
      }
  
  
}

 function buildCustomerForOrder() {
      const destination = document.getElementById("customerName")?.value || "";

      return {
        name: destination,
        number: "",
        email: "eyleatherorders@gmail.com",
        note: "",
        delivery: "",
        bookSupply: "eyleather"
      };
    }

export{
    submitOrder,
    buildOrderFromCart,
    toggleCart,
    updateCart,
    getCartQuantity,
    changeQty,
    addToCart,
    getSelectedStore
}