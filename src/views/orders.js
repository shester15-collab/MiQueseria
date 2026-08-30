import { data, save } from "../data/store.js";
import {
  money,
  esc,
  unit,
  date,
  capitalize,
  customer,
  product,
} from "../utils/helpers.js";


function orders(content, setTab, render) {
  const list = [...data.orders].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  content.innerHTML = `
    <div class="section-heading">
      <h2>Pedidos</h2>
      <button class="link" id="go-new">+ Nueva orden</button>
    </div>

    ${
      list.length
        ? list.map(orderCard).join("")
        : '<div class="empty">No hay pedidos registrados.</div>'
    }
  `;

  document.querySelector("#go-new").onclick = () =>
    setTab("newOrder");

  document
    .querySelectorAll("[data-order]")
    .forEach((button) => {
      button.onclick = () => {
        editOrder(content, setTab, render, button.dataset.order);
      };
    });
}


function orderCard(o) {
  
  const c = customer(data, o.customerId) || {    name: "Cliente eliminado",  };
  const disabled = o.status === "anulado";

  return `
    <article
      class="item ${disabled ? "order-disabled" : ""}"
      ${disabled ? "" : `data-order="${o.id}"`}
    >
      
      <div class="avatar">
        ${esc(c.name.slice(0, 2).toUpperCase())}
      </div>

      <div>
        <div class="name">
          ${esc(c.name)}
        </div>

        <div class="detail">
          ${date(o.date)} · ${money(o.total)}
        </div>

        <div class="detail">
          ${o.items
            .map(
              (i) =>
                `${i.quantity} ${unit(
                  product(data, i.productId) || {
                    unit: i.unit,
                  },
                )} ${esc(i.name)}`,
            )
            .join(" · ")}
        </div>
      </div>

      <button
        class="tag ${o.status}"
        ${disabled ? "disabled" : `data-order="${o.id}"`}
      >
        ${capitalize(o.status)}
      </button>

    </article>
  `;
}


function editOrder(content, setTab, render, orderId) {
  const order = data.orders.find(
    (o) => o.id === orderId,
  );

  if (!order) {
    alert("No se encontró el pedido.");
    return;
  }

  const originalItems = order.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));


  content.innerHTML = `
    <div class="section-heading">
      <h2>Editar pedido</h2>

      <button class="link" id="cancel">
        Cancelar
      </button>
    </div>


    <label>
      Cliente

      <select id="order-customer">
        ${data.customers
          .map(
            (c) =>
              `<option
                value="${c.id}"
                ${c.id === order.customerId ? "selected" : ""}
              >
                ${esc(c.name)}
              </option>`,
          )
          .join("")}
      </select>
    </label>


    <label>
      Fecha del pedido

      <input
        id="order-date"
        type="date"
        value="${order.date}"
      >
    </label>


    <div id="lines">

      ${data.products
        .map((p) => {
          const item = order.items.find(
            (i) => i.productId === p.id,
          );

          const quantity = item
            ? item.quantity
            : 0;

          /*
           * Como al entrar a editar devolvemos mentalmente
           * el stock original del pedido, el stock disponible
           * para esta edición es:
           *
           * stock actual + cantidad original del pedido
           */

          const originalQuantity = item
            ? item.quantity
            : 0;

          const available =
            p.stock + originalQuantity;

          return `
            <div class="form-grid product-line">

              <label>
                ${esc(p.name)} (${unit(p)})

                <input
                  class="qty"
                  data-product="${p.id}"
                  type="number"
                  min="0"
                  step="${p.unit === "kg" ? "0.1" : "1"}"
                  value="${quantity}"
                  data-original="${originalQuantity}"
                  data-stock="${available}"
                >
              </label>

              <div class="available">
                Disponibles:

                <strong>
                  ${available} ${unit(p)}
                </strong>

                <br>

                Precio:
                ${money(p.price)}
              </div>

            </div>
          `;
        })
        .join("")}

    </div>


    <label>
      Origen de pago

      <select id="payment">

        <option
          ${order.payment === "Efectivo" ? "selected" : ""}
        >
          Efectivo
        </option>

        <option
          ${order.payment === "Transferencia" ? "selected" : ""}
        >
          Transferencia
        </option>

        <option
          ${order.payment === "Tarjeta" ? "selected" : ""}
        >
          Tarjeta
        </option>

        <option
          ${order.payment === "Otro" ? "selected" : ""}
        >
          Otro
        </option>

      </select>
    </label>


    <label>
      Servicio a domicilio

      <select id="delivery">

        <option
          value="0"
          ${order.delivery === 0 ? "selected" : ""}
        >
          Sin cargo ($0)
        </option>

        <option
          value="30"
          ${order.delivery === 30 ? "selected" : ""}
        >
          Cargo cercano ($30)
        </option>

        <option
          value="50"
          ${order.delivery === 50 ? "selected" : ""}
        >
          Cargo distancia ($50)
        </option>

      </select>
    </label>


    <label>
      Estado del pedido

      <select id="order-status">

        ${[
          "pedido",
          "entregado",
          "pagado",
          "anulado",
        ]
          .map(
            (status) =>
              `<option
                value="${status}"
                ${order.status === status ? "selected" : ""}
              >
                ${capitalize(status)}
              </option>`,
          )
          .join("")}

      </select>
    </label>


    <div class="row total">

      <span>
        Importe total
      </span>

      <span id="total">
        ${money(order.total)}
      </span>

    </div>


    <div id="warning" class="warning"></div>


    <button class="primary" id="save-order">
      Guardar cambios
    </button>
  `;


  document
    .querySelectorAll(".qty, #delivery")
    .forEach((element) => {
      element.oninput = () =>
        calculateEditOrder();
    });


  document.querySelector("#cancel").onclick = () =>
    render();


  document.querySelector("#save-order").onclick = () =>
    saveEditedOrder(
      order,
      originalItems,
      setTab,
      render,
    );
}


function calculateEditOrder() {
  let total = Number(
    document.querySelector("#delivery").value,
  );

  let warning = "";
  let hasItems = false;


  document
    .querySelectorAll(".qty")
    .forEach((input) => {

      const p = product(
        data,
        input.dataset.product,
      );

      const q =
        Number(input.value) || 0;


      total += q * p.price;


      if (q > 0) {
        hasItems = true;
      }


      const available =
        Number(input.dataset.stock);


      if (q > available) {
        warning =
          `No hay suficiente stock de ${p.name}.`;
      }


      if (
        p.unit === "pieza" &&
        !Number.isInteger(q)
      ) {
        warning =
          `${p.name} debe capturarse en piezas completas.`;
      }
    });


  if (!hasItems && !warning) {
    warning =
      "Indica al menos un producto.";
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


function saveEditedOrder(  order,  originalItems,  setTab,  render,) {

  const calculation =
    calculateEditOrder();


  if (calculation.warning) {
    return;
  }


  const newItems =
    [...document.querySelectorAll(".qty")]
      .map((input) => {

        const p = product(
          data,
          input.dataset.product,
        );

        const quantity =
          Number(input.value) || 0;


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


  /*
   * 1. Regresamos al stock las cantidades
   *    originales del pedido.
   */

  originalItems.forEach((item) => {

    const p = product(
      data,
      item.productId,
    );

    if (p) {
      p.stock += item.quantity;
    }
  });


  /*
   * 2. Descontamos del stock las nuevas
   *    cantidades.
   */

  newItems.forEach((item) => {

    const p = product(
      data,
      item.productId,
    );

    if (p) {
      p.stock -= item.quantity;
    }
  });


  /*
   * 3. Actualizamos el pedido.
   */

  order.customerId =
    document.querySelector(
      "#order-customer",
    ).value;

  order.date =
    document.querySelector(
      "#order-date",
    ).value;

  order.items = newItems;

  order.payment =
    document.querySelector(
      "#payment",
    ).value;

  order.delivery =
    Number(
      document.querySelector(
        "#delivery",
      ).value,
    );

  order.total =
    calculation.total;

  order.status =
    document.querySelector(
      "#order-status",
    ).value;


  save();


  /*
   * Regresamos a la lista de pedidos.
   */

  setTab("orders");
}


export {  orders,  orderCard, editOrder,};