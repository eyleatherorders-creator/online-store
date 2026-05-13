import { CATALOG_RULES } from "./rules.js";

import { renderFilteredProducts } from "./products.js";

import {
  inventoryRows,
  selection
} from "./state.js";

import {
  parseCatalogNumber,
  getLabelFromCode
} from "./catalog.js";


const ACTIVE_BTN =
  "bg-black text-white ring-2 ring-black";

const INACTIVE_BTN =
  "bg-gray-100 text-gray-800 hover:bg-black hover:text-white";

const BUTTON_STYLES = {
  bookType: {
    active:
      "bg-black text-white border border-black shadow-md",
    inactive:
      "bg-white/80 text-gray-800 border border-gray-300 hover:bg-gray-100"
  },

  publisher: {
    active:
      "bg-stone-800 text-amber-50 border border-stone-700 shadow-md",
    inactive:
      "bg-stone-50 text-stone-700 border border-stone-200 hover:bg-stone-100"
  },

  color: {
    active:
      "bg-amber-900 text-amber-50 border border-amber-800 shadow-md",
    inactive:
      "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
  },

  design: {
    active:
      "bg-zinc-700 text-white border border-zinc-600 shadow-md",
    inactive:
      "bg-zinc-50 text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
  }
};

function renderBookTypeSelector() {
  const container = document.getElementById("bookTypeSelector");
  if (!container) return;

  container.innerHTML = "";

  CATALOG_RULES.bookType.forEach(rule => {
    const btn = createFilterButton({
      label: rule.match[0],
      value: rule.code,
      key: "bookType",
      onClick: () => {
        selection.bookType = rule.code;

        // reset downstream
        selection.publisher = null;
        selection.color = null;
        selection.design = null;

        renderPublisherSelector();
        renderColorSelector();
        renderDesignSelector();
        renderFilteredProducts();
        renderBookTypeSelector(); // 🔁 refresh highlight
      }
    });

    container.appendChild(btn);
  });
}

function renderPublisherSelector() {
  const container = document.getElementById("publisherSelector");
  if (!container) return;

  container.innerHTML = "";
  if (!selection.bookType) return;

  const publishers = new Set();

  inventoryRows.forEach(row => {
    const parts = parseCatalogNumber(row.catalogNumber);
    if (parts.bookType === selection.bookType) {
      publishers.add(parts.publisher);
    }
  });

  [...publishers].forEach(pub => {
    const btn = createFilterButton({
      label: getLabelFromCode(pub, CATALOG_RULES.publisher),
      value: pub,
      key: "publisher",
      onClick: () => {
        selection.publisher = pub;
        selection.color = null;
        selection.design = null;

        renderColorSelector();
        renderDesignSelector();
        renderFilteredProducts();
        renderPublisherSelector(); // 🔁 highlight
      }
    });

    container.appendChild(btn);
  });
}

function renderColorSelector() {
  const container = document.getElementById("colorSelector");
  if (!container) return;

  container.innerHTML = "";
  if (!selection.bookType || !selection.publisher) return;

  const colors = new Set();

  inventoryRows.forEach(row => {
    const parts = parseCatalogNumber(row.catalogNumber);
    if (
      parts.bookType === selection.bookType &&
      parts.publisher === selection.publisher
    ) {
      colors.add(parts.color);
    }
  });

  [...colors].forEach(color => {
    const btn = createFilterButton({
      label: getLabelFromCode(color, CATALOG_RULES.color),
      value: color,
      key: "color",
      onClick: () => {
        selection.color = color;
        selection.design = null;

        renderDesignSelector();
        renderFilteredProducts();
        renderColorSelector(); // 🔁 highlight
      }
    });

    container.appendChild(btn);
  });
}

function renderDesignSelector() {
  const container = document.getElementById("designSelector");
  if (!container) return;

  container.innerHTML = "";
  if (!selection.bookType || !selection.publisher) return;

  const designs = new Set();

  inventoryRows.forEach(row => {
    const parts = parseCatalogNumber(row.catalogNumber);
    if (
      parts.bookType === selection.bookType &&
      parts.publisher === selection.publisher &&
      (!selection.color || parts.color === selection.color)
    ) {
      designs.add(parts.design);
    }
  });

  [...designs].forEach(design => {
    const btn = createFilterButton({
      label: getLabelFromCode(design, CATALOG_RULES.design),
      value: design,
      key: "design",
      onClick: () => {
        selection.design = design;
        selection.color = null;

        renderColorSelector();
        renderFilteredProducts();
        renderDesignSelector(); // 🔁 highlight
      }
    });

    container.appendChild(btn);
  });
}

function createFilterButton({
  label,
  value,
  key,
  onClick
}) {
  const btn = document.createElement("button");

  const isActive = selection[key] === value;

  const styleSet = BUTTON_STYLES[key];

  btn.className = `
    px-5 py-2.5 rounded-2xl
    text-sm font-medium
    transition-all duration-200
    backdrop-blur-sm
    ${isActive ? styleSet.active : styleSet.inactive}
  `;

  btn.textContent = label;

  btn.onclick = onClick;

  return btn;
}

export {
 renderBookTypeSelector,
 renderColorSelector,
 renderDesignSelector,
 renderPublisherSelector,
 createFilterButton
};
