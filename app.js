import { loadUnifiedInventory ,initStores} from "./js/firebase.js";

import { renderBookTypeSelector,renderColorSelector,renderDesignSelector,renderPublisherSelector } from "./config/filters.js";

import { setInventoryRows } from "./config/state.js";
import { initAuth } from "./js/firebase.js";
import { buildCatalogNumber } from "./config/catalog.js";
import { openImageZoom } from "./config/products.js";
import { setSearchQuery, setShowPrices, showPrices,selection } from "./config/state.js";
import { renderFilteredProducts } from "./config/products.js";
import { updateCart } from "./config/cart.js";
import { loadRemoteRules, CATALOG_RULES, PRICE_MATRIX } from './config/rules.js';
import { exportMissingImagesReport } from './config/reports.js';

window.exportMissingImagesReport = exportMissingImagesReport;
const toggle = document.getElementById("priceToggle");

toggle.addEventListener("change", () => {
  setShowPrices(toggle.checked);

  renderFilteredProducts();
  updateCart();
});

const searchForm = document.getElementById("productSearchForm");
const searchInput = document.getElementById("productSearchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");

if (searchForm && searchInput) {
  searchForm.addEventListener("submit", event => {
    event.preventDefault();
    setSearchQuery(searchInput.value);
    renderFilteredProducts();
  });
}

if (clearSearchBtn && searchInput) {
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    setSearchQuery("");
    renderFilteredProducts();
  });
}

function resetToMainMenu() {
  const cartPanel = document.getElementById("cart");
  const productModal = document.getElementById("productModal");
  const imageZoom = document.getElementById("imageZoom");
  const storeModal = document.getElementById("storeModal");

  cartPanel?.classList.add("translate-x-full");
  productModal?.classList.add("hidden");
  productModal?.classList.remove("flex");
  imageZoom?.classList.add("hidden");
  imageZoom?.classList.remove("flex");
  storeModal?.classList.add("hidden");
  storeModal?.classList.remove("flex");

  selection.bookType = "1";
  selection.publisher = null;
  selection.color = null;
  selection.design = null;
  setSearchQuery("");

  if (searchInput) searchInput.value = "";

  const judaicaContainer = document.getElementById("judaicaSelector");
  if (judaicaContainer) judaicaContainer.innerHTML = "";

  renderBookTypeSelector();
  renderPublisherSelector();
  renderColorSelector();
  renderDesignSelector();
  renderFilteredProducts();

  document.querySelector(".menu-panel")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function protectMobileBackButton() {
  if (!window.history?.pushState) return;
  if (!window.matchMedia("(max-width: 768px)").matches) return;

  window.history.replaceState({ appView: "main" }, "", window.location.href);
  window.history.pushState({ appView: "inside-store" }, "", window.location.href);

  window.addEventListener("popstate", () => {
    resetToMainMenu();
    window.history.pushState({ appView: "inside-store" }, "", window.location.href);
  });
}

initAuth();
// window.addEventListener("DOMContentLoaded", async () => {
//   const success = await loadRemoteRules();
//   if (success) {
//     // 1. Await the raw inventory lines loading
//     const rows = await loadUnifiedInventory();
    
//     selection.bookType = "1";

//     // 2. Build catalog numbers completely before moving forward
//     const processed = rows.map(row => ({
//       ...row,
//       catalogNumber: buildCatalogNumber(row)
//     }));

//     // 3. Set the state and wait for it to process
//     await setInventoryRows(processed);

//     // 4. Run and await each rendering phase sequentially
//     await renderBookTypeSelector();
//     await renderPublisherSelector();
//     await renderColorSelector();
//     await renderDesignSelector();
    
//     // 5. Run the dependent layout updates after selectors are ready
//     await renderFilteredProducts();
//     await initStores();
//   }
// });

window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 [STAGE 1] DOMContentLoaded fired. Starting initialization sequence...");
  
  try {
    console.log("⏳ [STAGE 2] Requesting loadRemoteRules(). Waiting for response...");
    const success = await loadRemoteRules();
    console.log("✅ [STAGE 3] loadRemoteRules() finished execution. Result status:", success);
    
    if (!success) {
      console.error("❌ [HALT] loadRemoteRules returned false. Stopping execution loop.");
      return;
    }

    console.log("⏳ [STAGE 4] Requesting loadUnifiedInventory(). Waiting for data...");
    const rows = await loadUnifiedInventory();
    console.log(`✅ [STAGE 5] loadUnifiedInventory() finished. Retrieved ${rows?.length || 0} raw rows.`);

    if (!rows || rows.length === 0) {
      console.warn("⚠️ [WARN] Rows array is empty or undefined. Proceeding with empty state.");
    }
    
    selection.bookType = "1";

    console.log("⚙️ [STAGE 6] Mapping catalog numbers synchronously across items...");
    const processed = (rows || []).map((row, idx) => {
      try {
        return {
          ...row,
          catalogNumber: buildCatalogNumber(row)
        };
      } catch (err) {
        console.error(`❌ Error parsing row at index ${idx}:`, row, err);
        return row;
      }
    });
    console.log("✅ [STAGE 7] Catalog mapping completed safely.");

    console.log("⚙️ [STAGE 8] Pushing processed array to setInventoryRows...");
    setInventoryRows(processed);

    console.log("🎨 [STAGE 9] Initializing UI selectors components...");
    renderBookTypeSelector();
    renderPublisherSelector();
    renderColorSelector();
    renderDesignSelector();
    initStoreDetailsSync();
    console.log("✅ [STAGE 10] Selectors drawn successfully.");
    
    console.log("🎨 [STAGE 11] Running main product layout rendering engines...");
    renderFilteredProducts();
    // initStores();
    console.log("🎉 [STAGE 12] Core initialization routine completed successfully!");
    protectMobileBackButton();

    // Late structural inspection verification
    setTimeout(() => {
        const productContainer = document.getElementById('products-grid') || document.getElementById('products-list');
        console.log("🔍 [VERIFICATION] Checking products container after 100ms. Child elements count:", productContainer?.children?.length);
        if (productContainer && productContainer.children.length === 0 && processed.length > 0) {
            console.log("⚠️ [VERIFICATION FAILURE] Container empty despite data existing. Forcing secondary redrawing trigger...");
            renderFilteredProducts();
        }
    }, 100);

  } catch (error) {
    console.error("💥 [CRITICAL FAILURE] Exception caught during initialization sequence:", error);
  }
});

import { 
    addToCart,
    toggleCart,
    submitOrder,
    changeQty,
    openStoreModal,
    closeStoreModal,
    saveStoreDetails,
    initStoreDetailsSync,
    updateSelectedStoreDisplay
 } from "./config/cart.js"; // or wherever it is

window.addToCart = addToCart;
window.toggleCart = toggleCart
window.submitOrder = submitOrder
window.changeQty = changeQty
window.openStoreModal = openStoreModal
window.closeStoreModal = closeStoreModal
window.saveStoreDetails = saveStoreDetails
window.updateSelectedStoreDisplay = updateSelectedStoreDisplay
window.openImageZoom = openImageZoom
