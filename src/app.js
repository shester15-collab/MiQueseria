import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { App } from "@capacitor/app";

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
let tab = "dashboard";
const content = document.querySelector("#content");
const subtitle = document.querySelector("#page-title");
const sidebar = document.querySelector("#sidebar");
const overlay = document.querySelector("#overlay");
const menuBtn = document.querySelector("#menu-btn");
const closeMenu = document.querySelector("#close-menu");

document.querySelector("#menu-btn").onclick = () => {
  sidebar.classList.add("open");
  overlay.classList.add("show");
};

document.querySelector("#close-menu").addEventListener("click", () => {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
});

overlay.onclick = () => {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
};

document.querySelectorAll("#sidebar button[data-page]").forEach((btn) => {
  btn.onclick = () => {
    setTab(btn.dataset.page);

    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  };
});

function openMenu() {
  sidebar.classList.add("open");
  overlay.classList.add("show");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

App.addListener("backButton", () => {

  if (currentReportType) {
    currentReportType = null;
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

menuBtn.onclick = openMenu;

overlay.onclick = closeSidebar;

closeMenu.onclick = closeSidebar;

document.querySelectorAll("#sidebar button[data-page]").forEach((btn) => {
  btn.onclick = () => {
    tab = btn.dataset.page;

    render();

    // En móvil cerramos automáticamente.
    if (window.innerWidth < 768) {
      closeSidebar();
    }
  };
});

const uid = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const esc = (v = "") =>
  String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
const money = (n) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
const date = (d) =>
  new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(
    new Date(`${d}T12:00:00`),
  );
const today = () => new Date().toISOString().slice(0, 10);
const product = (id) => data.products.find((p) => p.id === id);
const customer = (id) => data.customers.find((c) => c.id === id);
const unit = (p) => (p.unit === "kg" ? "kg" : "pzas");

function load() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return value && Array.isArray(value.products)
      ? value
      : structuredClone(seed);
  } catch {
    return structuredClone(seed);
  }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function stockText(p) {
  return `${p.stock} ${unit(p)}`;
}
function setTab(next) {
  tab = next;
  render();
}

function render() {
  const labels = {
    dashboard: "Resumen de pedidos",
    newOrder: "Registrar un pedido",
    orders: "Historial de pedidos",
    products: "Catálogo de productos",
    stock: "Existencias",
    customers: "Catálogo de clientes",
    providers: "Catálogo de proveedores",
    reports: "Listados de información",
    help: "Información de la aplicación",
  };

  subtitle.textContent = labels[tab] ?? "Mi Quesería";

  document.querySelectorAll("#sidebar button[data-page]").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === tab);
  });

  const pages = {
    dashboard: dashboard,
    newOrder: newOrder,
    orders: orders,
    products: products,
    stock: stock,
    customers: customers,
    providers: providers,
    reports: reports,
    help: help,
  };  

  if (typeof pages[tab] !== "function") {
    console.error(`No existe una función para la página: ${tab}`);
    return;
  }

  pages[tab]();
}

function dashboard() {
  const active = data.orders.filter((o) => o.status !== "anulado");
  const sales = active.reduce((s, o) => s + o.total, 0);
  content.innerHTML = `<div class="section-heading"><h2>Inicio</h2><button class="link" id="go-new">+ Nueva orden</button></div>
    <div class="metrics"><div class="metric"><strong>${data.orders.length}</strong><span>Pedidos registrados</span></div><div class="metric"><strong>${money(sales)}</strong><span>Ventas acumuladas</span></div><div class="metric"><strong>${active.filter((o) => o.status === "pedido").length}</strong><span>Por entregar</span></div><div class="metric"><strong>${active.filter((o) => o.status === "pagado").length}</strong><span>Pagados</span></div></div>
    <h3>Stock disponible</h3>${data.products.length ? data.products.map((p) => `<div class="stock-line"><span>${esc(p.name)}</span><strong>${stockText(p)}</strong></div>`).join("") : '<div class="empty">Agrega productos para comenzar.</div>'}
    <h3 class="spaced">Pedidos recientes</h3>${recentOrders(10)}`;
  document.querySelector("#go-new").onclick = () => setTab("newOrder");
}

function recentOrders(limit) {
  const list = [...data.orders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
  return list.length
    ? list.map(orderCard).join("")
    : '<div class="empty">Aún no hay pedidos registrados.</div>';
}
function orderCard(o) {
  const c = customer(o.customerId) || { name: "Cliente eliminado" };
  return `<article class="item"><div class="avatar">${esc(c.name.slice(0, 2).toUpperCase())}</div><div><div class="name">${esc(c.name)}</div><div class="detail">${date(o.date)} · ${money(o.total)}</div><div class="detail">${o.items.map((i) => `${i.quantity} ${unit(product(i.productId) || { unit: i.unit })} ${esc(i.name)}`).join(" · ")}</div></div><button class="tag ${o.status}" data-order="${o.id}">${capitalize(o.status)}</button></article>`;
}
const capitalize = (v) => v.charAt(0).toUpperCase() + v.slice(1);

function newOrder() {
  if (!data.customers.length || !data.products.length) {
    content.innerHTML = `<div class="empty">Para crear un pedido primero registra al menos un cliente y un producto.</div>`;
    return;
  }
  content.innerHTML = `<div class="section-heading"><h2>Nueva orden</h2><button class="link" id="cancel">Cancelar</button></div>
    <label>Cliente<select id="order-customer">${data.customers.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></label>
    <label>Fecha del pedido<input id="order-date" type="date" value="${today()}"></label>
    <div id="lines">${data.products.map((p) => `<div class="form-grid product-line"><label>${esc(p.name)} (${unit(p)})<input class="qty" data-product="${p.id}" type="number" min="0" step="${p.unit === "kg" ? "0.1" : "1"}" value="0"></label><div class="available">Disponibles: <strong>${stockText(p)}</strong><br>Precio: ${money(p.price)}</div></div>`).join("")}</div>
    <label>Origen de pago<select id="payment"><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option><option>Otro</option></select></label>
    <label>Servicio a domicilio<select id="delivery"><option value="0">Sin cargo ($0)</option><option value="30">Cargo cercano ($30)</option><option value="50">Cargo distancia ($50)</option></select></label>
    <div class="row total"><span>Importe total</span><span id="total">${money(0)}</span></div><div id="warning" class="warning"></div><button class="primary" id="save-order">Guardar pedido</button>`;
  document
    .querySelectorAll(".qty, #delivery")
    .forEach((e) => (e.oninput = calculateOrder));
  document.querySelector("#cancel").onclick = () => setTab("dashboard");
  document.querySelector("#save-order").onclick = saveOrder;
}
function calculateOrder() {
  let total = Number(document.querySelector("#delivery").value);
  let warning = "";
  let hasItems = false;
  document.querySelectorAll(".qty").forEach((input) => {
    const p = product(input.dataset.product);
    const q = Number(input.value) || 0;
    total += q * p.price;
    if (q > 0) hasItems = true;
    if (q > p.stock) warning = `No hay suficiente stock de ${p.name}.`;
    if (p.unit === "pieza" && !Number.isInteger(q))
      warning = `${p.name} debe capturarse en piezas completas.`;
  });
  if (!hasItems && !warning) warning = "Indica al menos un producto.";
  document.querySelector("#total").textContent = money(total);
  document.querySelector("#warning").textContent = warning;
  return { total, warning, hasItems };
}
function saveOrder() {
  const calculation = calculateOrder();
  if (calculation.warning) return;
  const items = [...document.querySelectorAll(".qty")]
    .map((input) => {
      const p = product(input.dataset.product);
      const quantity = Number(input.value) || 0;
      return quantity
        ? {
            productId: p.id,
            name: p.name,
            unit: p.unit,
            quantity,
            price: p.price,
          }
        : null;
    })
    .filter(Boolean);
  items.forEach((i) => (product(i.productId).stock -= i.quantity));
  data.orders.unshift({
    id: uid("order"),
    customerId: document.querySelector("#order-customer").value,
    date: document.querySelector("#order-date").value,
    items,
    payment: document.querySelector("#payment").value,
    delivery: Number(document.querySelector("#delivery").value),
    total: calculation.total,
    status: "pedido",
    createdAt: new Date().toISOString(),
  });
  save();
  setTab("orders");
}

function orders() {
  const list = [...data.orders].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  content.innerHTML = `<div class="section-heading"><h2>Pedidos</h2><button class="link" id="go-new">+ Nueva orden</button></div>${list.length ? list.map((o) => `${orderCard(o)}<div class="order-actions"><label>Estado<select data-status="${o.id}">${["pedido", "entregado", "pagado", "anulado"].map((s) => `<option ${o.status === s ? "selected" : ""} value="${s}">${capitalize(s)}</option>`).join("")}</select></label></div>`).join("") : '<div class="empty">No hay pedidos registrados.</div>'}`;
  document.querySelector("#go-new").onclick = () => setTab("newOrder");
  document
    .querySelectorAll("[data-status]")
    .forEach(
      (s) => (s.onchange = () => changeStatus(s.dataset.status, s.value)),
    );
}
function changeStatus(id, next) {
  const o = data.orders.find((x) => x.id === id);
  if (o.status === next) return;
  if (o.status !== "anulado" && next === "anulado")
    o.items.forEach((i) => (product(i.productId).stock += i.quantity));
  if (o.status === "anulado" && next !== "anulado") {
    if (o.items.some((i) => product(i.productId).stock < i.quantity)) {
      alert("No hay stock suficiente para reactivar este pedido.");
      render();
      return;
    }
    o.items.forEach((i) => (product(i.productId).stock -= i.quantity));
  }
  o.status = next;
  save();
  render();
}

function products(editId = null) {
  const editing = editId && editId !== "new" ? product(editId) : null;
  content.innerHTML = `<div class="section-heading"><h2>Productos</h2><button class="link" id="new">+ Agregar</button></div>${editId ? `<label>Nombre de producto<input id="p-name" value="${esc(editing?.name || "")}"></label><div class="form-grid"><label>Unidad<select id="p-unit"><option value="kg" ${editing?.unit === "kg" ? "selected" : ""}>Kg</option><option value="pieza" ${editing?.unit === "pieza" ? "selected" : ""}>Pieza</option></select></label><label>Precio<input id="p-price" type="number" min="0" step="0.01" value="${editing?.price || ""}"></label></div><button class="primary" id="save-p">Guardar producto</button>` : ""}${data.products.map((p) => `<article class="item"><div class="avatar">${esc(p.name[0])}</div><div><div class="name">${esc(p.name)}</div><div class="detail">${money(p.price)} por ${unit(p)} · Stock: ${stockText(p)}</div></div><button class="link" data-edit="${p.id}">Editar</button></article>`).join("") || '<div class="empty">No hay productos.</div>'}`;
  document.querySelector("#new").onclick = () => products("new");
  document
    .querySelectorAll("[data-edit]")
    .forEach((b) => (b.onclick = () => products(b.dataset.edit)));
  if (editId)
    document.querySelector("#save-p").onclick = () => {
      const name = document.querySelector("#p-name").value.trim();
      if (!name) return;
      const obj = {
        name,
        unit: document.querySelector("#p-unit").value,
        price: Number(document.querySelector("#p-price").value) || 0,
      };
      if (editing) Object.assign(editing, obj);
      else data.products.push({ id: uid("product"), ...obj, stock: 0 });
      save();
      products();
    };
}

function stock() {
  content.innerHTML = `<h2>Stock</h2><p class="muted">Captura la existencia actual de cada producto.</p>${data.products.map((p) => `<label>${esc(p.name)} (${unit(p)})<input data-stock="${p.id}" type="number" min="0" step="${p.unit === "kg" ? "0.1" : "1"}" value="${p.stock}"></label>`).join("") || '<div class="empty">Primero registra un producto.</div>'}<button class="primary" id="save-stock">Guardar existencias</button>`;
  const b = document.querySelector("#save-stock");
  if (b)
    b.onclick = () => {
      document
        .querySelectorAll("[data-stock]")
        .forEach(
          (i) => (product(i.dataset.stock).stock = Number(i.value) || 0),
        );
      save();
      alert("Existencias guardadas.");
    };
}

function directory(kind, title, fields, editId = null) {
  const list = data[kind];
  const current =
    editId && editId !== "new" ? list.find((x) => x.id === editId) : null;
  content.innerHTML = `<div class="section-heading"><h2>${title}</h2><button class="link" id="new">+ Agregar</button></div>${editId ? fields.map((f) => `<label>${f.label}<input id="f-${f.key}" value="${esc(current?.[f.key] || "")}"></label>`).join("") + '<button class="primary" id="save">Guardar</button>' : ""}${
    list.length
      ? list
          .map(
            (x) =>
              `<article class="item"><div class="avatar">${esc(x.name[0])}</div><div><div class="name">${esc(x.name)}</div><div class="detail">${fields
                .slice(1)
                .map((f) => esc(x[f.key]))
                .filter(Boolean)
                .join(
                  " · ",
                )}</div></div><button class="link" data-edit="${x.id}">Editar</button></article>`,
          )
          .join("")
      : '<div class="empty">Aún no hay registros.</div>'
  }`;
  document.querySelector("#new").onclick = () =>
    directory(kind, title, fields, "new");
  document
    .querySelectorAll("[data-edit]")
    .forEach(
      (b) => (b.onclick = () => directory(kind, title, fields, b.dataset.edit)),
    );
  if (editId)
    document.querySelector("#save").onclick = () => {
      const obj = Object.fromEntries(
        fields.map((f) => [
          f.key,
          document.querySelector(`#f-${f.key}`).value.trim(),
        ]),
      );
      if (!obj.name) return;
      if (current) Object.assign(current, obj);
      else list.push({ id: uid(kind), ...obj });
      save();
      directory(kind, title, fields);
    };
}
function customers(editId) {
  directory(
    "customers",
    "Clientes",
    [
      { key: "name", label: "Nombre del cliente" },
      { key: "phone", label: "Número de teléfono" },
      { key: "address", label: "Dirección" },
      { key: "notes", label: "Observaciones" },
    ],
    editId,
  );
}
function providers(editId) {
  directory(
    "providers",
    "Proveedores",
    [
      { key: "name", label: "Nombre de proveedor" },
      { key: "phone", label: "Número de teléfono" },
      { key: "notes", label: "Observaciones" },
    ],
    editId,
  );
}

function reports() {
  content.innerHTML = `<h2>Reportes</h2><p class="muted">Genera un listado listo para imprimir o guardar como PDF.</p><button class="primary report" data-report="orders">Listado de pedidos</button><button class="secondary report" data-report="products">Listado de productos</button><button class="secondary report" data-report="customers">Listado de clientes</button><button class="secondary report" data-report="providers">Listado de proveedores</button>`;
  document
    .querySelectorAll(".report")
    .forEach((b) => (b.onclick = () => showReport(b.dataset.report)));
}

let currentReportType = null;

function showReport(type) {
  currentReportType = type;

  const reportInfo = {
    orders: {
      title: "Listado de pedidos",
      headers: [
        "Cliente",
        "Productos",
        "Fecha",
        "Importe",
        "Pago",
        "Domicilio",
      ],
    },

    products: {
      title: "Listado de productos",
      headers: ["Producto", "Unidad", "Precio", "Stock"],
    },

    customers: {
      title: "Listado de clientes",
      headers: ["Nombre", "Teléfono", "Dirección", "Observaciones"],
    },

    providers: {
      title: "Listado de proveedores",
      headers: ["Nombre", "Teléfono", "Dirección", "Observaciones"],
    },
  };

  const report = reportInfo[type];

  if (!report) {
    console.error(`Tipo de reporte desconocido: ${type}`);
    return;
  }

  let rows = [];

  if (type === "orders") {
    rows = data.orders.map((o) => {
      const c = customer(o.customerId) || {
        name: "Cliente eliminado",
      };

      return [
        c.name,
        o.items.map((i) => `${i.name}: ${i.quantity}`).join(", "),
        date(o.date),
        money(o.total),
        o.payment,
        money(o.delivery),
      ];
    });
  } else if (type === "products") {
    rows = data.products.map((p) => [
      p.name,
      unit(p),
      money(p.price),
      stockText(p),
    ]);
  } else if (type === "customers") {
    rows = data.customers.map((x) => [
      x.name,
      x.phone || "",
      x.address || "",
      x.notes || "",
    ]);
  } else if (type === "providers") {
    rows = data.providers.map((x) => [
      x.name,
      x.phone || "",
      x.address || "",
      x.notes || "",
    ]);
  }

  const tableRows = rows.length
    ? rows
        .map(
          (row) => `
            <tr>
              ${row
                .map((cell) => `<td>${esc(String(cell ?? ""))}</td>`)
                .join("")}
            </tr>
          `,
        )
        .join("")
    : `
        <tr>
          <td colspan="${report.headers.length}" class="report-empty">
            Sin registros
          </td>
        </tr>
      `;

  content.innerHTML = `
    <div class="report-view">

      <div class="report-toolbar">

        <button id="back-report" class="secondary">
          ← Volver
        </button>

        <div class="report-actions">

          <select id="export-report">
            <option value="">Exportar...</option>
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="jpg">Imagen (.jpg)</option>
          </select>

        </div>

      </div>

      <div id="report-document" class="report-document">

        <div class="report-header">
          <div>
            <h2>Mi Quesería</h2>
            <p>${report.title}</p>
          </div>

          <span class="report-date">
            ${new Date().toLocaleDateString("es-MX")}
          </span>
        </div>

        <div class="report-table-wrapper">

          <table id="report-table">

            <thead>
              <tr>
                ${report.headers
                  .map((head) => `<th>${esc(head)}</th>`)
                  .join("")}
              </tr>
            </thead>

            <tbody>
              ${tableRows}
            </tbody>

          </table>

        </div>

        <div class="report-summary">
          ${rows.length} registro${rows.length === 1 ? "" : "s"}
        </div>

      </div>

    </div>
  `;

  /*
   * Volver a la pantalla anterior.
   * Como el reporte fue abierto desde la vista de Reportes,regresamos a reports.
   */
  document.querySelector("#back-report").onclick = () => { setTab("reports"); };

  /*
   * Selector de exportación.
   */
  document.querySelector("#export-report").onchange = (event) => {
    const format = event.target.value;

    if (!format) return;

    exportReport(type, format);

    event.target.value = "";
  };
}
async function exportReport(type, format) {
  try {
    switch (format) {
      case "pdf":
        await exportReportPDF(type);
        break;

      case "xlsx":
        exportReportXLSX(type);
        break;

      case "jpg":
        await exportReportJPG(type);
        break;

      default:
        console.error(`Formato de exportación desconocido: ${format}`);
    }
  } catch (error) {
    console.error("Error al exportar reporte:", error);

    alert(
      "No fue posible generar el archivo. Revisa la consola para más información.",
    );
  }
}
function exportReportXLSX(type) {
  const table = document.querySelector("#report-table");

  if (!table) {
    console.error("No se encontró la tabla del reporte.");
    return;
  }

  const workbook = XLSX.utils.book_new();

  const worksheet = XLSX.utils.table_to_sheet(table);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

  const fileName = `Mi_Queseria_${type}_${fileDate()}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
async function exportReportPDF(type) {
  const reportTitles = {
    orders: "Listado de pedidos",
    products: "Listado de productos",
    customers: "Listado de clientes",
    providers: "Listado de proveedores",
  };

  const table = document.querySelector("#report-table");

  if (!table) {
    console.error("No se encontró la tabla del reporte.");
    return;
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  doc.setFontSize(18);
  doc.text("Mi Quesería", 14, 15);

  doc.setFontSize(12);
  doc.text(reportTitles[type] || "Reporte", 14, 23);

  const headers = [...table.querySelectorAll("thead th")].map((th) =>
    th.textContent.trim(),
  );

  const body = [...table.querySelectorAll("tbody tr")].map((tr) =>
    [...tr.querySelectorAll("td")].map((td) => td.textContent.trim()),
  );

  autoTable(doc,{
    head: [headers],
    body,
    startY: 30,

    styles: {
      fontSize: 8,
      cellPadding: 3,
    },

    headStyles: {
      fillColor: [78, 107, 43],
      textColor: 255,
      fontStyle: "bold",
    },

    alternateRowStyles: {
      fillColor: [245, 245, 239],
    },

    margin: {
      left: 14,
      right: 14,
    },
  });

  doc.save(`Mi_Queseria_${type}_${fileDate()}.pdf`);
}
async function exportReportJPG(type) {
  const report = document.querySelector("#report-document");

  if (!report) {
    console.error("No se encontró el contenido del reporte.");
    return;
  }

  const canvas = await html2canvas(report, {
    scale: 2,
    backgroundColor: "#fffef9",
    useCORS: true,
  });

  const image = canvas.toDataURL("image/jpeg", 0.95);

  const link = document.createElement("a");

  link.href = image;
  link.download = `Mi_Queseria_${type}_${fileDate()}.jpg`;

  document.body.appendChild(link);
  link.click();
  link.remove();
}
function fileDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function printReport(type) {
  const rows =
    type === "orders"
      ? data.orders.map((o) => {
          const c = customer(o.customerId) || { name: "Cliente eliminado" };
          return `<tr><td>${esc(c.name)}</td><td>${esc(o.items.map((i) => `${i.name}: ${i.quantity}`).join(", "))}</td><td>${date(o.date)}</td><td>${money(o.total)}</td><td>${esc(o.payment)}</td><td>${money(o.delivery)}</td></tr>`;
        })
      : type === "products"
        ? data.products.map(
            (p) =>
              `<tr><td>${esc(p.name)}</td><td>${unit(p)}</td><td>${money(p.price)}</td><td>${stockText(p)}</td></tr>`,
          )
        : data[type].map(
            (x) =>
              `<tr><td>${esc(x.name)}</td><td>${esc(x.phone || "")}</td><td>${esc(x.address || x.notes || "")}</td><td>${esc(x.notes || "")}</td></tr>`,
          );
  const heads =
    type === "orders"
      ? ["Cliente", "Productos", "Fecha", "Importe", "Pago", "Domicilio"]
      : type === "products"
        ? ["Producto", "Unidad", "Precio", "Stock"]
        : ["Nombre", "Teléfono", "Dirección / Observaciones", "Observaciones"];
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(
    `<!doctype html><meta charset="utf-8"><title>Mi Quesería</title><style>body{font-family:Arial;margin:28px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:8px;text-align:left}th{background:#eee}</style><h1>Mi Quesería</h1><h2>Listado de ${capitalize(type === "orders" ? "pedidos" : type === "products" ? "productos" : type === "customers" ? "clientes" : "proveedores")}</h2><table><thead><tr>${heads.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("") || `<tr><td colspan="${heads.length}">Sin registros</td></tr>`}</tbody></table><script>window.onload=()=>window.print()<\/script>`,
  );
  w.document.close();
}
function help() {
  content.innerHTML =
    '<h2>Ayuda</h2><div class="info-card"><strong>Mi Quesería</strong><p>Aplicación móvil para administrar pedidos, productos e inventario.</p><p><b>Desarrollado por:</b> Mi Quesería</p><p><b>Versión:</b> 2.0.0</p><p><b>Contacto:</b> soporte@miqueseria.mx</p></div>';
}

document
  .querySelectorAll("#sidebar .sidebar-nav button[data-page]")
  .forEach((b) => {
    b.onclick = () => {
      setTab(b.dataset.page);

      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    };
  });

render();
