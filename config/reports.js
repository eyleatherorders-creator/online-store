import { findProductsWithoutImages } from './products.js';

export async function exportMissingImagesReport() {
  const missing = await findProductsWithoutImages();

  if (!missing.length) {
    alert('לא נמצאו מוצרים ללא תמונה');
    return;
  }

  const headers = [
    'שם מוצר',
    'מק"ט',
    'נתיב תמונה חסרה'
  ];

  const rows = missing.map(item => [
    item.name,
    item.catalogNumber,
    item.image
  ]);

  const csvContent = [headers, ...rows]
    .map(row =>
      row
        .map(value => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');

  const BOM = "\uFEFF";

const blob = new Blob(
  [BOM + csvContent],
  {
    type: 'text/csv;charset=utf-8;'
  }
);

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'missing-product-images.csv';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
