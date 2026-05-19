import { loadUnifiedInventory ,initStores} from "./js/firebase.js";

import { renderBookTypeSelector,renderColorSelector,renderDesignSelector,renderPublisherSelector } from "./config/filters.js";

import { setInventoryRows } from "./config/state.js";

import { buildCatalogNumber } from "./config/catalog.js";

import { setShowPrices, showPrices,selection } from "./config/state.js";
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

// window.addEventListener("DOMContentLoaded", async () => {
//   const success = await loadRemoteRules();
//   if(success){

//     const rows = await loadUnifiedInventory();
//     selection.bookType = "1";
//     const processed = rows.map(row => ({
//       ...row,
//       catalogNumber: buildCatalogNumber(row)
//     }));

//     setInventoryRows(processed);
//     renderBookTypeSelector();
//     renderPublisherSelector();
//     renderColorSelector();
//     renderDesignSelector();
//     renderFilteredProducts();
//     initStores();

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
    console.log("✅ [STAGE 10] Selectors drawn successfully.");
    
    console.log("🎨 [STAGE 11] Running main product layout rendering engines...");
    renderFilteredProducts();
    initStores();
    console.log("🎉 [STAGE 12] Core initialization routine completed successfully!");

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
    changeQty
 } from "./config/cart.js"; // or wherever it is

window.addToCart = addToCart;
window.toggleCart = toggleCart
window.submitOrder = submitOrder
window.changeQty = changeQty
