function openProductModal(row) {
  modalState = {
    row,
    bookType: selection.bookType,
    size: parseCatalogNumber(row.catalogNumber).size,
    color: parseCatalogNumber(row.catalogNumber).color,
    design: parseCatalogNumber(row.catalogNumber).design
  };
  refreshModalProduct();

  document.getElementById("modalTitle").innerText = row.name;
  document.getElementById("modalStock").innerText = `זמין: ${row.total}`;

  renderModalSize();
  renderModalDesigns();
  renderModalColors();
  updateModalImage();

  document.getElementById("productModal").classList.remove("hidden");
  document.getElementById("productModal").classList.add("flex");
}

function closeProductModal() {
  document.getElementById("productModal").classList.add("hidden");
}

function refreshModalProduct() {
  const catalog = buildCatalogFromModal();

  // 1️⃣ Try real inventory
  let resolvedRow = inventoryRows.find(
    r => r.catalogNumber === catalog
  );

  // 2️⃣ If not found — check virtuals
  if (!resolvedRow) {
    resolvedRow = virtualProducts.find(
      v => v.catalogNumber === catalog
    );
  }

  // 3️⃣ Create virtual if FULL and missing
  if (!resolvedRow && isFullCatalogNumber(catalog)) {
    resolvedRow = createVirtualProduct(catalog);
  }

  // 4️⃣ Render modal
  if (resolvedRow) {
    modalState.row = resolvedRow;

    document.getElementById("modalTitle").innerText =
      resolvedRow.name;

    document.getElementById("modalStock").innerText =
      resolvedRow.total > 0
        ? `זמין: ${resolvedRow.total}`
        : "הבחירה אינה זמין במלאי , במידה ותזמין זה ייכנס לייצור מיידי!!";

    updateModalImage();
  } else {
    // partial / invalid catalog
    document.getElementById("modalStock").innerText =
      "הבחירה אינה זמין במלאי , במידה ותזמין זה ייכנס לייצור מיידי!!";
  }
}

function renderModalColors() {
  const wrap = document.getElementById("modalColors");
  wrap.innerHTML = "";

  CATALOG_RULES.color.forEach(r => {
    if (!r.visual) return;

    const swatch = document.createElement("div");

    swatch.className = `
      leather-swatch
      ${modalState.color === r.code ? "ring-2 ring-black" : ""}
    `;

    swatch.style.backgroundImage = `url(assets/images/colors/${r.code}.png)`;

    swatch.onclick = () => {
      modalState.color = r.code;
      renderModalColors();
      refreshModalProduct();
    };

    wrap.appendChild(swatch);
  });
}

function renderModalDesigns() {
  const wrap = document.getElementById("modalDesigns");
  wrap.innerHTML = "";

  CATALOG_RULES.design.forEach(r => {
    const btn = document.createElement("button");
    btn.textContent = r.match[0];
    btn.className = `
      px-3 py-1 rounded-xl border
      ${modalState.design === r.code ? "bg-black text-white" : ""}
    `;
    btn.onclick = () => {
      modalState.design = r.code;

      renderModalDesigns();
      refreshModalProduct(); // 🔥 THIS
    };

    wrap.appendChild(btn);
  });
}

function renderModalSize() {
  const select = document.getElementById("modalSize");
  select.innerHTML = "";

  CATALOG_RULES.size.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.code;
    opt.textContent = r.match[0];
    opt.selected = modalState.size === r.code;
    select.appendChild(opt);
  });

  select.onchange = e => {
    modalState.size = e.target.value;
    refreshModalProduct(); // 🔥
  };

}

function updateModalImage() {
  const imgElement = document.getElementById("modalImage");

  // 1. RESET STATE: Clear the "tried" flag so the next image can also try JPEG
  imgElement.removeAttribute('data-tried-jpeg');

  // 2. SET ERROR HANDLER
  imgElement.onerror = function() {
    if (!this.getAttribute('data-tried-jpeg')) {
      this.setAttribute('data-tried-jpeg', 'true');
      
      const currentSrc = this.src;
      // Note: Use .toLowerCase() to be safe with file extensions
      if (currentSrc.toLowerCase().includes('.png')) {
        this.src = currentSrc.replace(/\.png$/i, '.jpeg');
        console.log("PNG failed, attempting JPEG fallback...");
        return; 
      }
    }

    this.onerror = null; 
    this.src = 'assets/images/eyicon.png';
    console.warn("Product image (PNG & JPEG) failed to load, using placeholder.");
  };

  // 3. RESOLVE SOURCE
  // Make sure resolveProductImage returns a string ending in .png
  const newSrc = resolveProductImage(
    modalState.row,
    modalState.bookType,
    modalState.design,
    modalState.color
  );

  imgElement.src = newSrc;
}

function addModalToCart() {
  const item = {
    ...modalState.row,
    catalogNumber:
      `${parseCatalogNumber(modalState.row.catalogNumber).publisher}-` +
      `${modalState.bookType}-${modalState.size}-` +
      `${modalState.color}-${modalState.design}`
  };
  let existingItemIndex = cart.findIndex(line => line[0].catalogNumber === item.catalogNumber);
  if (existingItemIndex > -1) {
    cart[existingItemIndex][1] += 1;
  } else {
    cart.push([item ,1]);
  }
  showToast("הפריט נוסף לעגלה! ");
  console.log(getCartQuantity((existingItemIndex.catalogNumber||item.catalogNumber)));
  
  updateCart();
  closeProductModal();
}


function buildCatalogFromModal() {
  const base = parseCatalogNumber(modalState.row.catalogNumber);

  return [
    base.publisher,
    modalState.bookType,
    modalState.size,
    modalState.color,
    modalState.design
  ].join("-");
}

export{
    buildCatalogFromModal,
    addModalToCart,
    updateModalImage,
    refreshModalProduct,
    openProductModal,
    renderModalColors,
    renderModalDesigns,
    renderModalSize
}