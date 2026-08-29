const money = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2,  }).format(Number(n) || 0);
const uid = (prefix) =>  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const esc = (v = "") =>  String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const unit = (p) => (p.unit === "kg" ? "kg" : "pzas");
const product = (data, id) => data.products.find((p) => p.id === id);
const today = () => new Date().toISOString().slice(0, 10);
const date = (d) =>  new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format( new Date(`${d}T12:00:00`),);
const capitalize = (v) => v.charAt(0).toUpperCase() + v.slice(1);
const customer = (data, id) => data.customers.find((c) => c.id === id);

function stockText(p) {
  return `${p.stock} ${unit(p)}`;
}



export {  money,  esc,  stockText,  uid, unit, product, today, date,capitalize,customer, };