import {
  inventoryRows,
  selection,
  showPrices
} from "./state.js";

import {
  getProductPrice
} from "./rules.js"

import { parseCatalogNumber } from "./catalog.js";
import { openProductModal } from "./modal.js";
function renderFilteredProducts() {
  

  const grid = document.getElementById("productsGrid");

    if (!grid) {
    console.log("productsGrid not found");
    return;
    }

    grid.innerHTML = "";

  inventoryRows
    .filter(row => matchesSelection(row, selection))
    .forEach(row => {

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
            src="${resolveProductImage(row, selection.bookType, selection.design, selection.color)}"
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
          />

          ${visualColor ? `
          <div
            class="color-layer"
            style="
              --cover-color:${visualColor};
              -webkit-mask-image: url('${resolveProductImage(row, selection.bookType)}');
              mask-image: url('${resolveProductImage(row , selection.bookType)}');
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
        <!-- addToCart('${row.catalogNumber}')-->
        <button onclick="event.stopPropagation();addToCart('${row.catalogNumber}') "
          class="w-full mt-auto bg-black text-white py-2 rounded hover:bg-gray-800 transition-colors">
          להזמין
        </button>
      </div>

      `
      div.onclick = () => openProductModal(row);
      grid.appendChild(div);
    });
}


function resolveProductImage(row,bookType,style,color) {
  const name = row.name || '';

console.log(style+color);
  

  return 'assets/images/'+ bookType +'/'+ (style || row.catalogNumber.split("-")[4])+ (color || row.catalogNumber.split("-")[3])+'.png'
}

function matchesSelection(row, selection) {
  const parts = parseCatalogNumber(row.catalogNumber);

  if (selection.bookType && parts.bookType !== selection.bookType) return false;
  if (selection.publisher && parts.publisher !== selection.publisher) return false;

  if (selection.color && parts.color !== selection.color) return false;
  if (selection.design && parts.design !== selection.design) return false;

  return true;
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

export{
    renderFilteredProducts,
    resolveProductImage,
    matchesSelection
}
