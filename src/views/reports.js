import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { data } from "../data/store.js";
import { money,  esc,  stockText, unit, date,capitalize,customer } from "../utils/helpers.js";


let currentReportType = null;

function reports(content, setTab) {
  content.innerHTML = `<h2>Reportes</h2><p class="muted">Genera un listado listo para imprimir o guardar como PDF.</p><button class="primary report" data-report="orders">Listado de pedidos</button><button class="secondary report" data-report="products">Listado de productos</button><button class="secondary report" data-report="customers">Listado de clientes</button><button class="secondary report" data-report="providers">Listado de proveedores</button>`;
  document
    .querySelectorAll(".report")
    .forEach((b) => (b.onclick = () => showReport(b.dataset.report, setTab)));
}

function showReport(type, setTab) {
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
      const c = customer(data,o.customerId) || {
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

function closeReport() {
  if (!currentReportType) {
    return false;
  }

  currentReportType = null;
  return true;
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
          const c = customer(data,o.customerId) || { name: "Cliente eliminado" };
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

export{ reports, closeReport };