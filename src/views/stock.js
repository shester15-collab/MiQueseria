import { data, save } from "../data/store.js";
import { esc, unit, product  } from "../utils/helpers.js";

function stock(content) {
  content.innerHTML = `<h2>Stock</h2><p class="muted">Captura la existencia actual de cada producto.</p>${data.products.map((p) => `<label>${esc(p.name)} (${unit(p)})<input data-stock="${p.id}" type="number" min="0" step="${p.unit === "kg" ? "0.1" : "1"}" value="${p.stock}"></label>`).join("") || '<div class="empty">Primero registra un producto.</div>'}<button class="primary" id="save-stock">Guardar existencias</button>`;
  const b = document.querySelector("#save-stock");
  if (b) b.onclick = () => {
      document
        .querySelectorAll("[data-stock]")
        .forEach(
          (i) => (product(data, i.dataset.stock).stock= Number(i.value) || 0),
        );
      save();
      alert("Existencias guardadas.");
    };
}

export { stock };