import { data, save } from "../data/store.js";
import { money,  esc,  stockText,  uid, unit, product, today  } from "../utils/helpers.js";

function newOrder(content, setTab ) {
  if (!data.customers.length || !data.products.length) {
    content.innerHTML = `<div class="empty">Para crear un pedido primero registra al menos un cliente y un producto.</div>`;
    return;
  }

  content.innerHTML = `
    <div class="section-heading">
      <h2>Nueva orden</h2>
      <button class="link" id="cancel">Cancelar</button>
    </div>

    <label>
      Cliente
      <select id="order-customer">
        ${data.customers
          .map(
            (c) =>
              `<option value="${c.id}">${esc(c.name)}</option>`,
          )
          .join("")}
      </select>
    </label>

    <label>
      Fecha del pedido
      <input id="order-date" type="date" value="${today()}">
    </label>

    <div id="lines">
      ${data.products
        .map(
          (p) => `
            <div class="form-grid product-line">
              <label>
                ${esc(p.name)} (${unit(p)})
                <input
                  class="qty"
                  data-product="${p.id}"
                  type="number"
                  min="0"
                  step="${p.unit === "kg" ? "0.1" : "1"}"
                  value="0"
                >
              </label>

              <div class="available">
                Disponibles:
                <strong>${stockText(p)}</strong>
                <br>
                Precio: ${money(p.price)}
              </div>
            </div>
          `,
        )
        .join("")}
    </div>

    <label>
      Origen de pago
      <select id="payment">
        <option>Efectivo</option>
        <option>Transferencia</option>
        <option>Tarjeta</option>
        <option>Otro</option>
      </select>
    </label>

    <label>
      Servicio a domicilio
      <select id="delivery">
        <option value="0">Sin cargo ($0)</option>
        <option value="30">Cargo cercano ($30)</option>
        <option value="50">Cargo distancia ($50)</option>
      </select>
    </label>

    <div class="row total">
      <span>Importe total</span>
      <span id="total">${money(0)}</span>
    </div>

    <div id="warning" class="warning"></div>

    <button class="primary" id="save-order">
      Guardar pedido
    </button>
  `;

  document
    .querySelectorAll(".qty, #delivery")
    .forEach(
      (e) =>
        (e.oninput = () => calculateOrder(data, money))
    );

  document.querySelector("#cancel").onclick = () =>
    setTab("dashboard");

  document.querySelector("#save-order").onclick = () =>
    saveOrder(data, money, save, setTab, uid);
}


function calculateOrder(data, money) {
  let total = Number(
    document.querySelector("#delivery").value
  );

  let warning = "";
  let hasItems = false;

  document.querySelectorAll(".qty").forEach((input) => {
    const p = product(data, input.dataset.product);
    const q = Number(input.value) || 0;

    total += q * p.price;

    if (q > 0) {
      hasItems = true;
    }

    if (q > p.stock) {
      warning = `No hay suficiente stock de ${p.name}.`;
    }

    if (p.unit === "pieza" && !Number.isInteger(q)) {
      warning = `${p.name} debe capturarse en piezas completas.`;
    }
  });

  if (!hasItems && !warning) {
    warning = "Indica al menos un producto.";
  }

  document.querySelector("#total").textContent =
    money(total);

  document.querySelector("#warning").textContent =
    warning;

  return {
    total,
    warning,
    hasItems,
  };
}


function saveOrder(data, money, save, setTab, uid) {
  const calculation = calculateOrder(data, money);

  if (calculation.warning) return;

  const items = [...document.querySelectorAll(".qty")]
    .map((input) => {
      const p = product(data, input.dataset.product);
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

  items.forEach((i) => {
    product(data, i.productId).stock -= i.quantity;
  });

  data.orders.unshift({
    id: uid("order"),
    customerId:
      document.querySelector("#order-customer").value,
    date:
      document.querySelector("#order-date").value,
    items,
    payment:
      document.querySelector("#payment").value,
    delivery:
      Number(document.querySelector("#delivery").value),
    total: calculation.total,
    status: "pedido",
    createdAt: new Date().toISOString(),
  });

  save();

  setTab("orders");
}


export { newOrder };