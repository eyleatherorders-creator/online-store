import{
  CATALOG_RULES
} from "./rules.js"

function detectCode(name, rules) {
  for (const rule of rules) {
    if (rule.match.some(word => name.includes(word))) {
      return rule.code;
    }
  }
  return "0";
}

function detectRule(name, rules) {
  return rules.find(rule =>
    rule.match.some(word => name.includes(word))
  ) || null;
}
function buildCatalogNumber(row) {
  const name = row.name || "";

  const publisher = detectCode(name, CATALOG_RULES.publisher);
  const bookType  = detectCode(name, CATALOG_RULES.bookType);
  const size      = detectCode(name, CATALOG_RULES.size);
  const color     = detectCode(name, CATALOG_RULES.color);
  const design    = detectCode(name, CATALOG_RULES.design);
  const nusach    = detectCode(name, CATALOG_RULES.nusach);
  

  return `${publisher}-${nusach}-${bookType}-${size}-${color}-${design}`;
}
function parseCatalogNumber(catalog) {
  const [publisher, nusach, bookType, size, color, design] = catalog.split("-");
  return { publisher, nusach, bookType, size, color, design };
}

function getLabelFromCode(code, rules) {
  if (code === "0") return "לא מוגדר";

  const rule = rules.find(r => r.code === code);
  return rule ? rule.match[0] : code;
}

function buildNameFromCatalog(catalog) {
  const parts = parseCatalogNumber(catalog);

  const publisher =
    getLabelFromCode(parts.publisher, CATALOG_RULES.publisher);

  const nusach =
    getLabelFromCode(parts.nusach, CATALOG_RULES.nusach);

  const bookType =
    getLabelFromCode(parts.bookType, CATALOG_RULES.bookType);

  const size =
    getLabelFromCode(parts.size, CATALOG_RULES.size);

  const color =
    getLabelFromCode(parts.color, CATALOG_RULES.color);

  const design =
    getLabelFromCode(parts.design, CATALOG_RULES.design);

  return `${publisher} ${nusach} ${bookType} ${size} ${color} ${design} `;
}

export {
 detectCode,
 detectRule,
 buildCatalogNumber,
 parseCatalogNumber,
 getLabelFromCode,
 buildNameFromCatalog
};
