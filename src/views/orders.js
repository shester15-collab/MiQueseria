import { data, save } from "../data/store.js";
import { money,  esc, unit, date,capitalize,customer, product } from "../utils/helpers.js";


function orders(content, setTab, render) {
  const list = [...data.orders].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  content.innerHTML = `<div class="section-heading"><h2>Pedidos</h2><button class="link" id="go-new">+ Nueva orden</button></div>${list.length ? list.map((o) => `${orderCard(o)}<div class="order-actions"><label>Estado<select data-status="${o.id}">${["pedido", "entregado", "pagado", "anulado"].map((s) => `<option ${o.status === s ? "selected" : ""} value="${s}">${capitalize(s)}</option>`).join("")}</select></label></div>`).join("") : '<div class="empty">No hay pedidos registrados.</div>'}`;
  document.querySelector("#go-new").onclick = () => setTab("newOrder");
  document
    .querySelectorAll("[data-status]")
    .forEach(
      (s) => (s.onchange = () => changeStatus(render,s.dataset.status, s.value)),
    );
}

function orderCard(o) {
  const c = customer(data,o.customerId) || { name: "Cliente eliminado" };
  return `<article class="item"><div class="avatar">${esc(c.name.slice(0, 2).toUpperCase())}</div><div><div class="name">${esc(c.name)}</div><div class="detail">${date(o.date)} · ${money(o.total)}</div><div class="detail">${o.items.map((i) => `${i.quantity} ${unit(product(data,i.productId) || { unit: i.unit })} ${esc(i.name)}`).join(" · ")}</div></div><button class="tag ${o.status}" data-order="${o.id}">${capitalize(o.status)}</button></article>`;
}

function changeStatus(render,id, next) {
  const o = data.orders.find((x) => x.id === id);
  if (o.status === next) return;
  if (o.status !== "anulado" && next === "anulado")
    o.items.forEach((i) => (product(data,i.productId).stock += i.quantity));
  if (o.status === "anulado" && next !== "anulado") {
    if (o.items.some((i) => product(data,i.productId).stock < i.quantity)) {
      alert("No hay stock suficiente para reactivar este pedido.");
      render();
      return;
    }
    o.items.forEach((i) => (product(data,i.productId).stock -= i.quantity));
  }
  o.status = next;
  save();
  render();
}

export{ orders, orderCard};