
import { directory  } from "../utils/directory.js";

function customers(editId) {
  directory(
    "customers",
    "Clientes",
    [
      { key: "name", label: "Nombre del cliente" },
      { key: "phone", label: "Número de teléfono" },
      { key: "address", label: "Dirección" },
      { key: "notes", label: "Observaciones" },
    ],
    editId,
  );
}

export { customers };