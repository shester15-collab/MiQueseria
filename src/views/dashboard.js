import { data } from "../data/store.js";
import {  money,  esc,  stockText,  capitalize,} from "../utils/helpers.js";
import { orderCard } from "../views/orders.js";

let currentRange = "week";

function dashboard(content, setTab) {
  renderDashboard(content, setTab);
}


function renderDashboard(content, setTab) {

  const filteredOrders = filterOrders(currentRange);
  const active = filteredOrders.filter(    (o) => o.status !== "anulado",  );
  const sales = active.reduce(    (sum, order) => sum + Number(order.total || 0),    0,  );
  const delivered = filteredOrders.filter(    (o) => o.status === "entregado",  ).length;
  const pending = filteredOrders.filter(    (o) => o.status === "pedido",  ).length;
  const paid = filteredOrders.filter(    (o) => o.status === "pagado",  ).length;


  content.innerHTML = `
    <div class="section-heading">
      <h2>Inicio</h2>

      <button class="link" id="go-new">
        + Nueva orden
      </button>
    </div>


    <section class="dashboard-sales">

      <div class="sales-heading">
        <span>Ventas acumuladas</span>

        <strong>
          ${money(sales)}
        </strong>
      </div>


      <div class="chart-container">
        ${salesChart(filteredOrders)}
      </div>


      <div class="chart-filters">

        <button
          class="chart-filter ${currentRange === "week" ? "active" : ""}"
          data-range="week">
          1S
        </button>

        <button
          class="chart-filter ${currentRange === "month" ? "active" : ""}"
          data-range="month">
          1M
        </button>

        <button
          class="chart-filter ${currentRange === "year" ? "active" : ""}"
          data-range="year">
          1A
        </button>

        <button
          class="chart-filter ${currentRange === "all" ? "active" : ""}"
          data-range="all">
          All
        </button>

      </div>

    </section>


    <div class="dashboard-order-metrics">

      <div>
        <span>Pedidos</span>
        <strong>${filteredOrders.length}</strong>
      </div>

      <div>
        <span>Entregados</span>
        <strong>${delivered}</strong>
      </div>

      <div>
        <span>Por entregar</span>
        <strong>${pending}</strong>
      </div>

      <div>
        <span>Pagados</span>
        <strong>${paid}</strong>
      </div>

    </div>


    <h3 class="spaced">
      Pedidos recientes
    </h3>

    ${recentOrders(10)}
  `;


  document.querySelector("#go-new").onclick = () => {    setTab("newOrder");  };

  document .querySelectorAll("[data-range]").forEach((button) => {      
    button.onclick = () => {       
       currentRange = button.dataset.range;
        renderDashboard(content,setTab,);
      };
    });

     // Ir a editar el pedido
  document.querySelectorAll("[data-order]").forEach((button) => {
   button.onclick = () => {
    const orderId = button.dataset.order;

    setTab("editOrder", orderId);
  };
 });

}

document.querySelectorAll("[data-order]").forEach((button) => {
  button.onclick = () => {
    setTab("orders");
  };
});

function filterOrders(range) {
  if (range === "all") {
    return [...data.orders];
  }

  const now = new Date();

  let startDate = new Date(now);


  if (range === "week") {
    startDate.setDate(
      now.getDate() - 7,
    );
  }


  if (range === "month") {
    startDate.setMonth(
      now.getMonth() - 1,
    );
  }


  if (range === "year") {
    startDate.setFullYear(
      now.getFullYear() - 1,
    );
  }


  return data.orders.filter((order) => {

    const orderDate = new Date(
      `${order.date}T12:00:00`,
    );

    return orderDate >= startDate;
  });
}

function salesChart(orders) {
  const active = orders.filter(
    (o) => o.status !== "anulado",
  );

  if (!active.length) {
    return `
      <div class="chart-empty">
        Sin ventas para este periodo.
      </div>
    `;
  }


  const grouped = groupSales(active);

  const values = Object.values(grouped);

  const maxValue = Math.max(
    ...values,
    1,
  );


  const width = 600;
  const height = 220;

  const paddingX = 20;
  const paddingY = 20;


  const usableWidth =
    width - paddingX * 2;

  const usableHeight =
    height - paddingY * 2;


  const points = values.map(
    (value, index) => {

      const x =
        values.length === 1
          ? width / 2
          : paddingX +
            (index /
              (values.length - 1)) *
              usableWidth;


      const y =
        height -
        paddingY -
        (value / maxValue) *
          usableHeight;


      return {
        x,
        y,
        value,
      };
    },
  );


  const pointString = points
    .map((p) => `${p.x},${p.y}`)
    .join(" ");


  return `
    <svg
      class="sales-chart"
      viewBox="0 0 ${width} ${height}"
      preserveAspectRatio="none"
      aria-label="Gráfica de ventas">

      <line
        x1="${paddingX}"
        y1="${height - paddingY}"
        x2="${width - paddingX}"
        y2="${height - paddingY}"
        class="chart-axis"
      />

      <polyline
        points="${pointString}"
        class="chart-line"
      />

      ${points
        .map(
          (p) => `
            <circle
              cx="${p.x}"
              cy="${p.y}"
              r="4"
              class="chart-point"
            />
          `,
        )
        .join("")}

    </svg>
  `;
}
function groupSales(orders) {
  const grouped = {};


  orders
    .sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date),
    )
    .forEach((order) => {

      let key;


      if (currentRange === "year") {

        key = order.date.slice(0, 7);

      } else if (currentRange === "all") {

        key = order.date.slice(0, 7);

      } else {

        key = order.date;

      }


      if (!grouped[key]) {
        grouped[key] = 0;
      }


      grouped[key] +=
        Number(order.total || 0);

    });


  return grouped;
}

function recentOrders(limit) {
  const list = [...data.orders]
    .sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )
    .slice(0, limit);

  return list.length
    ? list.map(orderCard).join("")
    : '<div class="empty">Aún no hay pedidos registrados.</div>';
}

export { dashboard, recentOrders };

