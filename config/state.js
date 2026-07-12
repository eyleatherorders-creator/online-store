export let cart = [];
export let modalState = {};
export let inventoryRows = [];
export let allOrders = [];
export let stores = [];
export const selection = {
  bookType: null,
  publisher: null,
  size: null,
  color: null,
  design: null,
  searchQuery: ""
};

export function setInventoryRows(rows) {
  inventoryRows = rows;
}

export function setAllOrders(data) {
  allOrders = data;
}
export function setStores(data){
    stores = data
}

export let showPrices = true;

export function setShowPrices(value) {
  showPrices = value;
}

export function setSearchQuery(value) {
  selection.searchQuery = String(value || "").trim();
}
