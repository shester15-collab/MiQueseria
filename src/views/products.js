import { data, save } from "../data/store.js";
import { money,  esc,  stockText,  uid, unit, product,  } from "../utils/helpers.js";
import {recentOrders} from "../views/dashboard.js"

function products(content, setTab,editId = null) { 
  const editing = editId && editId !== "new" ? product(data,editId) : null;
  content.innerHTML = `<div class="section-heading"><h2>Productos</h2><button class="link" id="new">+ Agregar</button></div>${editId ? `<label>Nombre de producto<input id="p-name" value="${esc(editing?.name || "")}"></label><div class="form-grid"><label>Unidad<select id="p-unit"><option value="kg" ${editing?.unit === "kg" ? "selected" : ""}>Kg</option><option value="pieza" ${editing?.unit === "pieza" ? "selected" : ""}>Pieza</option></select></label><label>Precio<input id="p-price" type="number" min="0" step="0.01" value="${editing?.price || ""}"></label></div><button class="primary" id="save-p">Guardar producto</button>` : ""}${data.products.map((p) => `<article class="item"><div class="avatar">${esc(p.name[0])}</div><div><div class="name">${esc(p.name)}</div><div class="detail">${money(p.price)} por ${unit(p)} · Stock: ${stockText(p)}</div></div><button class="link" data-edit="${p.id}">Editar</button></article>`).join("") || '<div class="empty">No hay productos.</div>'}`;
  document.querySelector("#new").onclick = () =>  products(content, recentOrders, setTab, "new");
  document  .querySelectorAll("[data-edit]").forEach((b) => (b.onclick = () => products(content, recentOrders, setTab, b.dataset.edit)),);

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
      products(content, recentOrders, setTab);
    };
}

export { products };