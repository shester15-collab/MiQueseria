import { directory  } from "../utils/directory.js";

function providers(editId) {
  directory(
    "providers",
    "Proveedores",
    [
      { key: "name", label: "Nombre de proveedor" },
      { key: "phone", label: "Número de teléfono" },
      { key: "notes", label: "Observaciones" },
    ],
    editId,
  );
}

export { providers };