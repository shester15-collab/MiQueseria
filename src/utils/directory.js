import { data, save } from "../data/store.js";
import { money,  esc,  stockText,  uid, unit, product, today  } from "../utils/helpers.js";

function directory(kind, title, fields, editId = null) {
  const list = data[kind];
  const current = editId && editId !== "new" ? list.find((x) => x.id === editId) : null;
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
export { directory };