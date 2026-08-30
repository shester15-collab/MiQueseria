import { data, save } from "../data/store.js";
import {  money,  esc,  stockText,  uid,  unit,  product,  today,  capitalize,} from "../utils/helpers.js";


function newOrder(content, setTab) {
  renderOrderForm(content, setTab);
}


function editOrder(content, setTab, orderId) {
  const order = data.orders.find((o) => o.id === orderId);

  if (!order) {
    content.innerHTML = `
      <div class="empty">
        No se encontró el pedido solicitado.
      </div>
    `;
    return;
  }

  renderOrderForm(content, setTab, order);
}


function renderOrderForm(content, setTab, order = null) {
  const editing = Boolean(order);

  if (!data.customers.length || !data.products.length) {
    content.innerHTML = `
      <div class="empty">
        Para crear un pedido primero registra al menos
        un cliente y un producto.
      </div>
    `;
    return;
  }


  content.innerHTML = `
    <div class="section-heading">
      <h2>${editing ? "Editar pedido" : "Nueva orden"}</h2>

      <button class="link" id="cancel">
        Cancelar
      </button>
    </div>


    <label>
      Cliente

      <select id="order-customer">
        ${data.customers
          .map(
            (c) => `
              <option
                value="${c.id}"
                ${order?.customerId === c.id ? "selected" : ""}
              >
                ${esc(c.name)}
              </option>
            `,
          )
          .join("")}
      </select>
    </label>


    <label>
      Fecha del pedido

      <input
        id="order-date"
        type="date"
        value="${order?.date || today()}"
      >
    </label>


    <div id="lines">

      ${data.products
        .map((p) => {
          const existingItem =
            order?.items.find(
              (item) => item.productId === p.id,
            );

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
                  value="${existingItem?.quantity || 0}"
                >
              </label>


              <div class="available">
                Disponibles:

                <strong>
                  ${stockTextForOrder(p, order)}
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
          value="Efectivo"
          ${order?.payment === "Efectivo" ? "selected" : ""}
        >
          Efectivo
        </option>

        <option
          value="Transferencia"
          ${order?.payment === "Transferencia" ? "selected" : ""}
        >
          Transferencia
        </option>

        <option
          value="Tarjeta"
          ${order?.payment === "Tarjeta" ? "selected" : ""}
        >
          Tarjeta
        </option>

        <option
          value="Otro"
          ${order?.payment === "Otro" ? "selected" : ""}
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
          ${Number(order?.delivery || 0) === 0 ? "selected" : ""}
        >
          Sin cargo ($0)
        </option>

        <option
          value="30"
          ${Number(order?.delivery) === 30 ? "selected" : ""}
        >
          Cargo cercano ($30)
        </option>

        <option
          value="50"
          ${Number(order?.delivery) === 50 ? "selected" : ""}
        >
          Cargo distancia ($50)
        </option>

      </select>
    </label>


    ${
      editing
        ? `
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
                  (status) => `
                    <option
                      value="${status}"
                      ${
                        order.status === status
                          ? "selected"
                          : ""
                      }
                    >
                      ${capitalize(status)}
                    </option>
                  `,
                )
                .join("")}

            </select>
          </label>
        `
        : ""
    }


    <div class="row total">
      <span>Importe total</span>
      <span id="total">${money(order?.total || 0)}</span>
    </div>


    <div id="warning" class="warning"></div>


    <button class="primary" id="save-order">
      ${editing ? "Guardar cambios" : "Guardar pedido"}
    </button>
  `;


  document
    .querySelectorAll(".qty, #delivery")
    .forEach((element) => {
      element.oninput = () => {
        calculateOrder(data, money, order);
      };
    });


  document.querySelector("#cancel").onclick = () => {
    setTab(editing ? "orders" : "dashboard");
  };


  document.querySelector("#save-order").onclick = () => {
    if (editing) {
      updateOrder(order, content, setTab);
    } else {
      saveOrder(data, money, save, setTab, uid);
    }
  };


  calculateOrder(data, money, order);
}


function stockTextForOrder(p, order) {
  if (!order) {
    return stockText(p);
  }

  const originalItem = order.items.find(
    (item) => item.productId === p.id,
  );

  const originalQuantity =
    originalItem?.quantity || 0;

  return `${p.stock + originalQuantity} ${unit(p)}`;
}


function calculateOrder(data, money, order = null) {
  let total = Number(
    document.querySelector("#delivery").value,
  );

  let warning = "";
  let hasItems = false;


  document.querySelectorAll(".qty").forEach((input) => {
    const p = product(
      data,
      input.dataset.product,
    );

    const q = Number(input.value) || 0;

    total += q * p.price;


    if (q > 0) {
      hasItems = true;
    }


    let availableStock = p.stock;


    // Cuando editamos un pedido,
    // devolvemos virtualmente al stock
    // la cantidad que ya pertenecía al pedido.
    if (order) {
      const originalItem = order.items.find(
        (item) =>
          item.productId === p.id,
      );

      if (originalItem) {
        availableStock += originalItem.quantity;
      }
    }


    if (q > availableStock) {
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


function saveOrder(data, money, save, setTab, uid) {
  const calculation =
    calculateOrder(data, money);


  if (calculation.warning) {
    return;
  }


  const items = [
    ...document.querySelectorAll(".qty"),
  ]
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


  items.forEach((item) => {
    product(
      data,
      item.productId,
    ).stock -= item.quantity;
  });


  data.orders.unshift({
    id: uid("order"),

    customerId:
      document.querySelector(
        "#order-customer",
      ).value,

    date:
      document.querySelector(
        "#order-date",
      ).value,

    items,

    payment:
      document.querySelector(
        "#payment",
      ).value,

    delivery:
      Number(
        document.querySelector(
          "#delivery",
        ).value,
      ),

    total: calculation.total,

    status: "pedido",

    createdAt:
      new Date().toISOString(),
  });


  save();

  setTab("orders");
}


function updateOrder(order, content, setTab) {
  const calculation =
    calculateOrder(data, money, order);


  if (calculation.warning) {
    return;
  }


  const newItems = [
    ...document.querySelectorAll(".qty"),
  ]
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
   * Primero devolvemos al stock
   * las cantidades originales del pedido.
   */
  order.items.forEach((item) => {
    const p = product(
      data,
      item.productId,
    );

    if (p) {
      p.stock += item.quantity;
    }
  });


  /*
   * Después descontamos las nuevas cantidades.
   */
  for (const item of newItems) {
    const p = product(
      data,
      item.productId,
    );

    if (!p) {
      continue;
    }

    if (p.stock < item.quantity) {
      alert(
        `No hay suficiente stock de ${p.name}.`,
      );

      /*
       * Si algo falla, reconstruimos
       * el stock original.
       */
      restoreOriginalStock(order);

      return;
    }

    p.stock -= item.quantity;
  }


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


  const status =
    document.querySelector(
      "#order-status",
    );

  if (status) {
    order.status = status.value;
  }


  save();

  setTab("orders");
}


function restoreOriginalStock(order) {
  order.items.forEach((item) => {
    const p = product(
      data,
      item.productId,
    );

    if (p) {
      p.stock -= item.quantity;
    }
  });
}


export {  newOrder,  editOrder, };