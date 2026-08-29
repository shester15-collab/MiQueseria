import { data, } from "../data/store.js";
import { money,  esc,  stockText,  } from "../utils/helpers.js";
import { orderCard } from "../views/orders.js";

function dashboard(content, setTab) {
  const active = data.orders.filter((o) => o.status !== "anulado");
  const sales = active.reduce((s, o) => s + o.total, 0);

  content.innerHTML = `
    <div class="section-heading">
      <h2>Inicio</h2>
      <button class="link" id="go-new">+ Nueva orden</button>
    </div>

    <div class="metrics">
      <div class="metric">
        <strong>${data.orders.length}</strong>
        <span>Pedidos registrados</span>
      </div>

      <div class="metric">
        <strong>${money(sales)}</strong>
        <span>Ventas acumuladas</span>
      </div>

      <div class="metric">
        <strong>${active.filter((o) => o.status === "pedido").length}</strong>
        <span>Por entregar</span>
      </div>

      <div class="metric">
        <strong>${active.filter((o) => o.status === "pagado").length}</strong>
        <span>Pagados</span>
      </div>
    </div>

    <h3>Stock disponible</h3>

    ${
      data.products.length
        ? data.products
            .map(
              (p) =>
                `<div class="stock-line">
                  <span>${esc(p.name)}</span>
                  <strong>${stockText(p)}</strong>
                </div>`,
            )
            .join("")
        : '<div class="empty">Agrega productos para comenzar.</div>'
    }

    <h3 class="spaced">Pedidos recientes</h3>
    ${recentOrders(10)}
  `;

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

export { dashboard,recentOrders };

