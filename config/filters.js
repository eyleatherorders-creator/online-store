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

// filters.js

const BUTTON_STYLES = {
  bookType: {
    active:
      "bg-slate-950 text-white border border-slate-950 shadow-lg ring-2 ring-slate-950/15",
    inactive:
      "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 hover:border-slate-500"
  },

  publisher: {
    active:
      "bg-emerald-900 text-white border border-emerald-900 shadow-lg ring-2 ring-emerald-900/15",
    inactive:
      "bg-white text-emerald-950 border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-500"
  },

  color: {
    active:
      "bg-amber-800 text-white border border-amber-800 shadow-lg ring-2 ring-amber-800/15",
    inactive:
      "bg-white text-amber-950 border border-amber-200 hover:bg-amber-50 hover:border-amber-500"
  },

  design: {
    active:
      "bg-indigo-900 text-white border border-indigo-900 shadow-lg ring-2 ring-indigo-900/15",
    inactive:
      "bg-white text-indigo-950 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-500"
  }
};
const ACTIVE_BTN =
  "bg-black text-white ring-2 ring-black";

const INACTIVE_BTN =
  "bg-gray-100 text-gray-800 hover:bg-black hover:text-white";

// function renderBookTypeSelector() {
//   const container = document.getElementById("bookTypeSelector");
//   if (!container) return;

//   container.innerHTML = "";

//   CATALOG_RULES.bookType.forEach(rule => {
//     const matchingPublisher = CATALOG_RULES.publisher.find(pub => pub.match.includes(rule.match[0]));
    
//     if(!matchingPublisher || !matchingPublisher.code =='J'){
//       console.log(rule,matchingPublisher)
//       const btn = createFilterButton({
//         label: rule.match[0],
//         value: rule.code,
//         key: "bookType",
//         onClick: () => {
//           selection.bookType = rule.code;

//           // reset downstream
//           selection.publisher = null;
//           selection.color = null;
//           selection.design = null;

//           renderPublisherSelector();
//           renderColorSelector();
//           renderDesignSelector();
//           renderFilteredProducts();
//           renderBookTypeSelector(); // 🔁 refresh highlight
//         }
//       });

//       container.appendChild(btn);
//     }
//     });
//     let btn = createFilterButton({
//       label: 'מוצרי יודאיקה',
//       value: 'judaica',
//       key:'publisher',
//       onClick : () =>{
//         selection.bookType = null;
//         // reset downstream
//         selection.publisher = 'judaica';
//         selection.color = null;
//         selection.design = null;
//         renderJudaicaSelector();
//         renderBookTypeSelector();
//       }
//     });
//     container.appendChild(btn)
// }

// export function renderJudaicaSelector(){
//   const container = document.getElementById("judaicaSelector");
//   if(!container) return;
//   CATALOG_RULES.bookType.forEach(rule => {
//     const matchingPublisher = CATALOG_RULES.publisher.find(pub => pub.match.includes(rule.match[0]));
//     if(matchingPublisher && matchingPublisher.code == "J"){
//       const btn = createFilterButton({
//         label: rule.match[0],
//         value: rule.code,
//         key: "bookType",
//         onClick: () => {
//           selection.bookType = rule.code;

//           // reset downstream
//           selection.publisher = 'judaica';
//           selection.color = null;
//           selection.design = null;
//           renderFilteredProducts();
//           renderBookTypeSelector(); // 🔁 refresh highlight
//         }
//       });
//       container.appendChild(btn);
//     }
    
//   })
 
  
  
// }
 

// function renderPublisherSelector() {
//   const container = document.getElementById("publisherSelector");
//   if (!container) return;

//   container.innerHTML = "";
//   if (!selection.bookType) return;

//   const publishers = new Set();

//   inventoryRows.forEach(row => {
//     const parts = parseCatalogNumber(row.catalogNumber);
//     if (parts.bookType === selection.bookType) {
//       publishers.add(parts.publisher);
//     }
//   });

//   [...publishers].forEach(pub => {
//     const btn = createFilterButton({
//       label: getLabelFromCode(pub, CATALOG_RULES.publisher),
//       value: pub,
//       key: "publisher",
//       onClick: () => {
//         selection.publisher = pub;
//         selection.color = null;
//         selection.design = null;

//         renderColorSelector();
//         renderDesignSelector();
//         renderFilteredProducts();
//         renderPublisherSelector(); // 🔁 highlight
//       }
//     });

//     container.appendChild(btn);
//   });
// }

function renderBookTypeSelector() {
  const container = document.getElementById("bookTypeSelector");
  if (!container) return;

  container.innerHTML = ""; 

  CATALOG_RULES.bookType.forEach(rule => {
    const matchingPublisher = CATALOG_RULES.publisher.find(pub => pub.match && pub.match.includes(rule.match[0]));
    
    if (!matchingPublisher || matchingPublisher.code !== 'J') {
      const btn = createFilterButton({
        label: rule.match[0],
        value: rule.code,
        key: "bookType",
        onClick: () => {
          selection.bookType = rule.code;

          // Reset downstream completely
          selection.publisher = null;
          selection.color = null;
          selection.design = null;

          // 🌟 VANISH JUDAICA: Clear the judaica panel container when switching away
          const judaicaContainer = document.getElementById("judaicaSelector");
          if (judaicaContainer) judaicaContainer.innerHTML = "";

          renderPublisherSelector();
          renderColorSelector();
          renderDesignSelector();
          renderFilteredProducts();
          renderBookTypeSelector(); 
        }
      });

      container.appendChild(btn);
    }
  });

  // Create global Judaica category button
  let btn = createFilterButton({
    label: 'מוצרי יודאיקה',
    value: 'judaica',
    key: 'publisher', 
    onClick : () => {
      selection.bookType = null;
      selection.publisher = 'judaica';
      selection.color = null;
      selection.design = null;
      
      // Hide standard publisher filters
      const pubContainer = document.getElementById("publisherSelector");
      if(pubContainer) pubContainer.innerHTML = "";

      renderJudaicaSelector();
      renderFilteredProducts();
      renderBookTypeSelector();
    }
  });
  container.appendChild(btn);
}


export function renderJudaicaSelector(){
  const container = document.getElementById("judaicaSelector");
  if(!container) return;
  
  container.innerHTML = ""; 

  CATALOG_RULES.bookType.forEach(rule => {
    // Find the actual rules publisher code (which is 'J')
    const matchingPublisher = CATALOG_RULES.publisher.find(pub => pub.match && pub.match.includes(rule.match[0]));
    
    if(matchingPublisher && matchingPublisher.code == "J"){
      const btn = createFilterButton({
        label: rule.match[0],
        value: rule.code,
        key: "bookType",
        onClick: () => {
          selection.bookType = rule.code;
          
          // 🌟 FIX: Instead of the placeholder string 'judaica', pass the real publisher code ('J')
          // This allows your state filter engine to find the items in inventoryRows!
          selection.publisher = matchingPublisher.code; 
          
          selection.color = null;
          selection.design = null;

          renderFilteredProducts();
          renderJudaicaSelector();   
          renderBookTypeSelector();  
        }
      });
      container.appendChild(btn);
    }
  });
}


function renderPublisherSelector() {
  const container = document.getElementById("publisherSelector");
  if (!container) return;

  container.innerHTML = "";
  
  // 🌟 If no booktype is selected, OR we are in Judaica mode, DO NOT show publishers
  if (!selection.bookType || selection.publisher === 'judaica') return;

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
        renderPublisherSelector(); 
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

  // 🌟 Enhanced active check: Keeps 'מוצרי יודאיקה' lit up when its value is 'judaica' OR 'J'
  let isActive = selection[key] === value;
  if (value === 'judaica' && selection.publisher === 'J') {
    isActive = true;
  }

  const styleSet = BUTTON_STYLES[key];

  btn.className = `
    filter-btn px-5 py-2.5
    text-sm
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-700
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
