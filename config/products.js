import {
  inventoryRows,
  selection,
  showPrices
} from "./state.js";

import { IMAGE_MAPPING_GROUPS } from "./imageUrlMap.js";

import {
  CATALOG_RULES,
  getProductPrice
} from "./rules.js"

import { getLabelFromCode, parseCatalogNumber } from "./catalog.js";
import { openProductModal } from "./modal.js";
function renderFilteredProducts() {
  

  const grid = document.getElementById("productsGrid");

    if (!grid) {
    console.log("productsGrid not found");
    return;
    }

    grid.innerHTML = "";

  const rows = inventoryRows.filter(row => {
    if (selection.searchQuery) return matchesSearch(row, selection.searchQuery);
    return matchesSelection(row, selection);
  });

  if (rows.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full bg-white/90 border border-white rounded-lg p-8 text-center shadow">
        <h3 class="font-bold text-lg mb-2">לא נמצאו מוצרים</h3>
        <p class="text-sm text-gray-600">נסה לחפש שם מוצר, צבע, הוצאה או מק״ט אחר.</p>
      </div>
    `;
    return;
  }

  rows.forEach(row => {
      const rowParts = parseCatalogNumber(row.catalogNumber);
      const imageBookType = selection.searchQuery ? rowParts.bookType : selection.bookType;
      const imageDesign = selection.searchQuery ? rowParts.design : selection.design;
      const imageColor = selection.searchQuery ? rowParts.color : selection.color;

      let factoryBadge = row.factory.available > 0 
      ? `<span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">מפעל</span>` 
      : '';
      let rivhitBadge = row.rivhit.available > 0 
        ? `<span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">חנות</span>` 
        : '';
      const visualColor = null//getVisualColorFromCatalog(row);
      const div = document.createElement("div");
      div.className = "bg-white p-4 rounded-xl shadow flex flex-col h-full cursor-pointer";
      const cardId = "card-" + row.catalogNumber;
      div.id = cardId;
      div.innerHTML = `
     <div class="h-52 sm:h-60 md:h-64 bg-gray-100 overflow-hidden relative">
        <div class="blend-area">
          <div class="sharp-layer"></div>

          <div class="base"></div>

          <img
            src="${resolveProductImage(row, imageBookType, imageDesign, imageColor)}"
            alt="${row.name}"
            onerror="
            if (!this.getAttribute('data-tried-jpeg')) {
                this.setAttribute('data-tried-jpeg', 'true');
                this.src = this.src.replace('.png', '.jpeg');
            } else {
                this.onerror = null; 
                this.src = 'assets/images/eyicon.png';
                // MOVE CARD TO END
                const card = document.getElementById('${cardId}');
                if(card) { document.getElementById('productsGrid').appendChild(card); }
            }
          "
          onclick="openImageZoom('${resolveProductImage(row, imageBookType, imageDesign, imageColor)}')"
          id="product-image${cardId}"
          />

          ${visualColor ? `
          <div
            class="color-layer"
            style="
              --cover-color:${visualColor};
              -webkit-mask-image: url('${resolveProductImage(row, imageBookType)}');
              mask-image: url('${resolveProductImage(row , imageBookType)}');
            "
          ></div>
        ` : ``}

        </div>
      </div>

      <div class="p-4 flex-grow flex flex-col">
        
        <h3 class="font-bold">${row.name}</h3>
                ${showPrices ? `
          <h4 class="font-bold">
            מחיר: ${parseInt(getProductPrice(row))} ₪
          </h4>
        ` : ``}
        <p class="text-sm text-gray-500 mb-4">${row.catalogNumber} <strong>זמין: </strong>${row.total}</p>
        <div class="flex gap-2 mb-2">
           ${factoryBadge}
           ${rivhitBadge}
        </div>
        <div id="${row.catalogNumber}">
        <!-- addToCart('${row.catalogNumber}')-->
        <button onclick="event.stopPropagation();addToCart('${row.catalogNumber}') "
          class="w-full mt-auto bg-black text-white py-2 rounded hover:bg-gray-800 transition-colors">
          להזמין
        </button>
        </div>
      </div>

      `
      // div.onclick = () => openProductModal(row);
      grid.appendChild(div);
    });
}


// function resolveProductImage(row, bookType, style, color) {
//   const name = row.name || '';

  
//   const rawStyle = style || String(row.catalogNumber || '').split("-")[4] || '';
//   const cleanStyle = rawStyle.replace('D', '')
//   const finalColor = color || String(row.catalogNumber || '').split("-")[3] || '';

//   return 'assets/images/' + bookType + '/' + cleanStyle + finalColor + '.png';
// }

function resolveProductImage(row, bookType, style, color) {
  
  // 1. Calculate the style and color strings from arguments or catalog number
  const rawStyle = style || String(row.catalogNumber || '').split("-")[5] || '';
  const cleanStyle = rawStyle.replace('D', '');
  const finalColor = color || String(row.catalogNumber || '').split("-")[4] || '';
  
  const searchTarget = cleanStyle + finalColor; // e.g., "07W"

  // 2. Check if we have an image group mapped for this specific bookType (e.g., group 4)
  const targetGroup = IMAGE_MAPPING_GROUPS[bookType];
  
  if (targetGroup) {
    // Look through the URLs in this bookType group
    const urls = Object.values(targetGroup);
    
    for (const url of urls) {
      // Strip the URL to get the file name (e.g., "https://.../07W.png" -> "07W")
      const lastSlashIndex = url.lastIndexOf('/');
      const lastDotIndex = url.lastIndexOf('.');
      const strippedName = url.substring(lastSlashIndex + 1, lastDotIndex);

      // If it matches our target code exactly, return the cloud URL right away!
      if (strippedName === searchTarget) {
        return url;
      }
    }
  }

  // 3. Fallback: If no cloud URL group or match exists, use your local asset path
  return 'assets/images/' + bookType + '/' + cleanStyle + finalColor + '.png';
}

function matchesSelection(row, selection) {
  const parts = parseCatalogNumber(row.catalogNumber);

  if (selection.bookType && parts.bookType !== selection.bookType) return false;
  if (selection.publisher && parts.publisher !== selection.publisher) return false;

  if (selection.color && parts.color !== selection.color) return false;
  if (selection.design && parts.design !== selection.design) return false;

  return true;
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[״"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesSearch(row, query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const parts = parseCatalogNumber(row.catalogNumber || "");
  const labels = [
    getLabelFromCode(parts.publisher, CATALOG_RULES.publisher || []),
    getLabelFromCode(parts.nusach, CATALOG_RULES.nusach || []),
    getLabelFromCode(parts.bookType, CATALOG_RULES.bookType || []),
    getLabelFromCode(parts.size, CATALOG_RULES.size || []),
    getLabelFromCode(parts.color, CATALOG_RULES.color || []),
    getLabelFromCode(parts.design, CATALOG_RULES.design || [])
  ];

  const searchable = normalizeSearchText([
    row.name,
    row.catalogNumber,
    row.total,
    row.factory?.available,
    row.rivhit?.available,
    ...labels
  ].join(" "));

  return searchable.includes(normalizedQuery);
}

// image report
export async function findProductsWithoutImages() {
  const missing = [];

  for (const row of inventoryRows) {
    const imagePath = resolveProductImage(
      row,
      selection.bookType,
      selection.design,
      selection.color
    );

    const exists = await imageExists(imagePath);

    if (!exists) {
      missing.push({
        name: row.name,
        catalogNumber: row.catalogNumber,
        image: imagePath
      });
    }
  }

  return missing;
}

function imageExists(src) {
  return new Promise(resolve => {
    const img = new Image();

    img.onload = () => resolve(true);

    img.onerror = () => {
      const jpegSrc = src.replace('.png', '.jpeg');

      const jpegImg = new Image();

      jpegImg.onload = () => resolve(true);
      jpegImg.onerror = () => resolve(false);

      jpegImg.src = jpegSrc;
    };

    img.src = src;
  });
}

export function openImageZoom(src) {
  const zoom = document.getElementById("imageZoom");
  const zoomImg = document.getElementById("imageZoomImg");
  // let id = 'product-image'+ cardId
  
  // const modalImg = document.getElementById(id);
  zoomImg.src = src;

  zoom.classList.remove("hidden");
  zoom.classList.add("flex");

  // REAL zoom
  requestAnimationFrame(() => {
    zoomImg.style.transform = "scale(1.8)";
  });
}

function closeImageZoom() {
  const zoom = document.getElementById("imageZoom");
  const zoomImg = document.getElementById("imageZoomImg");

  zoomImg.style.transform = "scale(1)";

  setTimeout(() => {
    zoom.classList.add("hidden");
    zoom.classList.remove("flex");
  }, 200);
}
document
  .getElementById("imageZoom")
  .addEventListener("click", closeImageZoom);



export{
    renderFilteredProducts,
    resolveProductImage,
    matchesSelection,
    matchesSearch
}
