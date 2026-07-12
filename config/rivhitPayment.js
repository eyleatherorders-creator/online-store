const CREATE_PAYMENT_URL =
  window.RIVHIT_CREATE_PAYMENT_URL ||
  "https://rivhit-payment.e-y-leather.workers.dev/";

function buildReturnUrl(status, orderId) {
  const url = new URL(window.location.href);
  url.searchParams.set("payment", status);
  url.searchParams.set("orderId", orderId);
  return url.toString();
}

export async function createRivhitTestPaymentUrl(orderEntry, cartLines, getProductPrice) {
  const items = cartLines.map(([row, quantity]) => ({
    Description: row.name || row.catalogNumber || "מוצר",
    Quantity: quantity,
    UnitPrice: Number(getProductPrice(row) || 0)
  }));

  const paymentRequest = {
    Items: items,
    CustomerLastName: orderEntry.store || "לקוח אתר",
    CustomerFirstName: orderEntry.customer?.name || "לקוח",
    EmailAddress: orderEntry.customer?.email || "eyleatherorders@gmail.com",
    Order: String(orderEntry.orderId).replace(/\D/g, "").slice(-15),
    Comments: `הזמנה באתר: ${orderEntry.orderId}`,
    RedirectURL: buildReturnUrl("success", orderEntry.orderId),
    FailRedirectURL: buildReturnUrl("failed", orderEntry.orderId),
    DocumentLanguage: "he",
    Currency: 1,
    PriceIncludeVAT: true,
    SaleType: 1
  };

  const response = await fetch(CREATE_PAYMENT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ paymentRequest })
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "פונקציית התשלום עדיין לא פעילה באתר הזה. יש לפרוס את Firebase Functions ו-Firebase Hosting, או להגדיר כתובת פונקציה פעילה ב-RIVHIT_CREATE_PAYMENT_URL."
      );
    }

    throw new Error(data?.message || "שגיאה ביצירת עמוד התשלום");
  }

  if (!data?.paymentUrl) {
    throw new Error("לא התקבל קישור לעמוד תשלום מריווחית.");
  }

  return data.paymentUrl;
}
