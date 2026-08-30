
import { App } from "@capacitor/app";
import { initNavigation } from "./navigation/navigation.js";
import { dashboard } from "./views/dashboard.js";
import { newOrder } from "./views/newOrder.js";
import { orders, editOrder } from "./views/orders.js";
import { stock } from "./views/stock.js";
import { products } from "./views/products.js";
import { customers } from "./views/customers.js";
import { providers } from "./views/providers.js";
import { reports, closeReport } from "./views/reports.js";
import { help } from "./views/help.js";

const content = document.querySelector("#content");
const subtitle = document.querySelector("#page-title");

let tab = "dashboard";
let selectedOrderId = null;

function setTab(next, orderId = null) {
  tab = next;
  selectedOrderId = orderId;
  render();
}

function render() {
  const labels = {
    dashboard: "Resumen de pedidos",
    newOrder: "Registrar un pedido",
    orders: "Historial de pedidos",
    editOrder:"Editar pedido",
    products: "Catálogo de productos",
    stock: "Existencias",
    customers: "Catálogo de clientes",
    providers: "Catálogo de proveedores",
    reports: "Listados de información",
    help: "Información de la aplicación",
  };

  subtitle.textContent = labels[tab] ?? "Mi Quesería";

  const pages = {
  dashboard: () => dashboard(content, setTab),
  newOrder: () => newOrder(content, setTab),
  orders: () => orders(content, setTab, render),
  editOrder: () => editOrder(content, setTab, render, selectedOrderId),
  products: () => products(content),
  stock: () => stock(content),
  customers: () => customers(content),
  providers: () => providers(content),
  reports: () => reports(content, setTab),
  help: () => help(content),
  
};

  if (typeof pages[tab] !== "function") {
    console.error(`No existe una función para la página: ${tab}`);
    return;
  }

  pages[tab]();
}

initNavigation(setTab);

App.addListener("backButton", () => {
  if (closeReport()) {
    setTab("reports");
    return;
  }

  if (tab !== "dashboard") {
    setTab("dashboard");
    return;
  }

  // Ya estamos en Inicio
  App.exitApp();
});


render();
