import { loadUnifiedInventory ,initStores} from "./js/firebase.js";

import { renderBookTypeSelector,renderColorSelector,renderDesignSelector,renderPublisherSelector } from "./config/filters.js";

import { setInventoryRows } from "./config/state.js";

import { buildCatalogNumber } from "./config/catalog.js";

import { setShowPrices, showPrices,selection } from "./config/state.js";
import { renderFilteredProducts } from "./config/products.js";
import { updateCart } from "./config/cart.js";
import { loadRemoteRules, CATALOG_RULES, PRICE_MATRIX } from './config/rules.js';

const toggle = document.getElementById("priceToggle");

toggle.addEventListener("change", () => {
  setShowPrices(toggle.checked);

  renderFilteredProducts();
  updateCart();
});

window.addEventListener("DOMContentLoaded", async () => {
  const success = await loadRemoteRules();
  if(success){

    const rows = await loadUnifiedInventory();
    selection.bookType = "1";
    const processed = rows.map(row => ({
      ...row,
      catalogNumber: buildCatalogNumber(row)
    }));

    setInventoryRows(processed);
    renderBookTypeSelector();
    renderPublisherSelector();
    renderColorSelector();
    renderDesignSelector();
    renderFilteredProducts();
    initStores();

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
