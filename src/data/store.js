const STORAGE_KEY = "mi-queseria-v3";

const seed = {
  products: [
    { id: "queso", name: "Queso", unit: "kg", price: 140, stock: 0 },
    { id: "panela", name: "Panela", unit: "pieza", price: 70, stock: 0 },
  ],
  customers: [],
  providers: [],
  orders: [],
};

let data = load();

function load() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return value && Array.isArray(value.products) ? value : structuredClone(seed);
  } catch {
    return structuredClone(seed);
  }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export { data, load, save };