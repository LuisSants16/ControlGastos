let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
let gastosTemporales = [];
let diaSeleccionado = new Date().toLocaleDateString();

function saludoDinamico() {
  const hora = new Date().getHours();
  let saludo = "¡Bienvenido!";
  if (hora >= 5 && hora < 12) saludo = "🌞 Buenos días";
  else if (hora < 18) saludo = "🌆 Buenas tardes";
  else saludo = "🌙 Buenas noches";
  const topBar = document.getElementById("topBar");
  if (topBar) topBar.textContent = saludo + " | Control de Gastos Diario";
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("modoOscuro", isDark);

  const btn = document.getElementById("modoOscuroBtn");
  if (btn) {
    btn.textContent = isDark ? "☀️ Modo Claro" : "🌗 Modo Oscuro";
  }
}

function agregarGasto() {
  const categoria = document.getElementById("categoria").value;
  const descripcion = document.getElementById("descripcion").value.trim();
  const monto = parseFloat(document.getElementById("monto").value);
  if (!descripcion || isNaN(monto)) return alert("Completa los datos.");
  const hora = new Date().toLocaleTimeString();
  const id = Date.now() + Math.random();
  const gasto = { id, descripcion: categoria + " - " + descripcion, monto, hora };
  const bloque = gastos.find(b => b.fecha === diaSeleccionado);
  if (bloque) {
    bloque.items.push(gasto);
  } else {
    gastos.push({ fecha: diaSeleccionado, items: [gasto] });
  }
  localStorage.setItem("gastos", JSON.stringify(gastos));
  document.getElementById("descripcion").value = "";
  document.getElementById("monto").value = "";
  mostrarBloques();
  actualizarTotal();
}

function guardarSueldo() {
  const sueldo = parseFloat(document.getElementById("sueldo").value);
  if (!isNaN(sueldo)) {
    localStorage.setItem("sueldoMensual", sueldo);
    document.getElementById("sueldoMostrado").textContent = sueldo.toFixed(2);
    alert("💾 Sueldo guardado correctamente.");
  } else {
    alert("Ingresa un sueldo válido.");
  }
}

function mostrarBloques() {
  const contenedor = document.getElementById("bloques");
  contenedor.innerHTML = "";
  const bloque = gastos.find(b => b.fecha === diaSeleccionado);
  if (!bloque) return;

  const div = document.createElement("div");
  div.className = "bloque";
  div.dataset.fecha = bloque.fecha

    div.ondragover = (e) => {
    e.preventDefault();
  };

  div.ondrop = (e) => {
    e.preventDefault();
    div.classList.remove("drop-target");
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    const { gastoId, fechaOrigen } = data;

    const bloqueOrigen = gastos.find(b => b.fecha === fechaOrigen);
    const bloqueDestino = bloque;
    if (!bloqueOrigen || !bloqueDestino) return;

    const fromIndex = bloqueOrigen.items.findIndex(g => g.id === gastoId);
    if (fromIndex === -1) return;

    const [movido] = bloqueOrigen.items.splice(fromIndex, 1);
    bloqueDestino.items.push(movido);

    localStorage.setItem("gastos", JSON.stringify(gastos));
    mostrarBloques();
    actualizarTotal();
    const idMovido = movido.id;

    setTimeout(() => {
      const bloquesDOM = document.querySelectorAll(".bloque");
      bloquesDOM.forEach(b => {
        const item = [...b.querySelectorAll(".bloque-item")].find(el => el.dataset.id == idMovido);
        if (item) {
          item.classList.add("gasto-cambiado");
          setTimeout(() => item.classList.remove("gasto-cambiado"), 1000);
        }
      });
    }, 50);
  };

  let subtotal = 0;
  bloque.items.forEach((g, i) => {
  const item = document.createElement("div");
  item.className = "bloque-item";

    item.innerHTML = `
      <span>${g.descripcion} (${g.hora})</span>
      <div class="gasto-acciones">
        <span>S/ ${g.monto.toFixed(2)}</span>
        <button onclick="editarGasto('${bloque.fecha}', ${i})">✏️</button>
        <button onclick="eliminarGasto('${bloque.fecha}', ${i})">❌</button>
      </div>
    `;
    div.appendChild(item);
    subtotal += g.monto;
  });

  const total = document.createElement("div");
  total.className = "bloque-total";
  total.textContent = `🧾 Total del día: S/ ${subtotal.toFixed(2)}`;
  div.appendChild(total);
  contenedor.appendChild(div);

  const acciones = document.createElement("div");
  acciones.className = "bloque-acciones";
  acciones.style.display = "flex";
  acciones.style.gap = "10px";
  acciones.style.marginTop = "10px";

  const btnReporte = document.createElement("button");
  btnReporte.textContent = "📄 Reporte";
  btnReporte.className = "btn-reporte";
  btnReporte.onclick = () => exportarBloqueReporte(bloque.fecha);
  acciones.appendChild(btnReporte);

  /* Botón Borrar bloque */
  const btnBorrar = document.createElement("button");
  btnBorrar.textContent = "🗑️ Borrar bloque";
  btnBorrar.className = "btn-eliminar";
  btnBorrar.onclick = () => {
    if (confirm("¿Seguro que deseas borrar este bloque completo?")) {
      const index = gastos.findIndex(b => b.fecha === bloque.fecha);
      if (index !== -1) {
        gastos.splice(index, 1);
        localStorage.setItem("gastos", JSON.stringify(gastos));
        mostrarBloques();
        actualizarTotal();
      }
    }
  };
  acciones.appendChild(btnBorrar);

  const btnAgregarGasto = document.createElement("button");
  btnAgregarGasto.textContent = "➕ Agregar gasto";
  btnAgregarGasto.className = "btn-agregar-secundario";
  btnAgregarGasto.onclick = () => {
    if (div.querySelector('.form-inline')) return;

    const form = document.createElement("div");
    form.className = "form-inline";
    form.style.display = "flex";
    form.style.flexDirection = "column";
    form.style.gap = "6px";
    form.style.marginTop = "10px";

    const catSelect = document.createElement("select");
    catSelect.innerHTML = `
      <option value="🍔 Comida">🍔 Comida</option>
      <option value="🚗 Movilidad">🚗 Movilidad</option>
      <option value="🏠 Casa">🏠 Casa</option>
      <option value="📱 Tecnología">📱 Tecnología</option>
      <option value="🎮 Entretenimiento">🎮 Entretenimiento</option>
      <option value="🛒 Compras">🛒 Compras</option>
      <option value="💼 Trabajo">💼 Trabajo</option>
      <option value="🎁 Regalo">🎁 Regalo</option>
      <option value="💊 Salud">💊 Salud</option>
      <option value="📚 Educación">📚 Educación</option>
    `;

    const descInput = document.createElement("input");
    descInput.placeholder = "Descripción adicional";

    const montoInput = document.createElement("input");
    montoInput.type = "number";
    montoInput.placeholder = "Monto (S/.)";

    const guardarBtn = document.createElement("button");
    guardarBtn.textContent = "✔️ Guardar gasto";
    guardarBtn.onclick = () => {
      const descripcion = catSelect.value + " - " + descInput.value.trim();
      const monto = parseFloat(montoInput.value);
      if (!descInput.value.trim() || isNaN(monto)) return alert("Completa los campos.");
      const hora = new Date().toLocaleTimeString();
      const id = Date.now() + Math.random();
      bloque.items.push({ id, descripcion, monto, hora });
      localStorage.setItem("gastos", JSON.stringify(gastos));
      mostrarBloques();
      actualizarTotal();
    };

    const cancelarBtn = document.createElement("button");
    cancelarBtn.textContent = "❌ Cancelar";
    cancelarBtn.onclick = () => form.remove();

    const btnGroup = document.createElement("div");
    btnGroup.style.display = "flex";
    btnGroup.style.gap = "10px";
    btnGroup.appendChild(guardarBtn);
    btnGroup.appendChild(cancelarBtn);

    form.appendChild(catSelect);
    form.appendChild(descInput);
    form.appendChild(montoInput);
    form.appendChild(btnGroup);
    div.appendChild(form);
  };

  acciones.appendChild(btnAgregarGasto);
  div.appendChild(acciones);
}

function editarGasto(fecha, index) {
  const bloque = gastos.find(b => b.fecha === fecha);
  if (!bloque) return;
  const g = bloque.items[index];
  const nuevaDescripcion = prompt("Editar descripción:", g.descripcion);
  const nuevoMonto = parseFloat(prompt("Editar monto:", g.monto));
  if (!nuevaDescripcion || isNaN(nuevoMonto)) return;
  g.descripcion = nuevaDescripcion;
  g.monto = nuevoMonto;
  localStorage.setItem("gastos", JSON.stringify(gastos));
  mostrarBloques();
  actualizarTotal();
}

function eliminarGasto(fecha, index) {
  const bloque = gastos.find(b => b.fecha === fecha);
  if (!bloque) return;
  if (confirm("¿Eliminar este gasto?")) {
    bloque.items.splice(index, 1);
    localStorage.setItem("gastos", JSON.stringify(gastos));
    mostrarBloques();
    actualizarTotal();
  }
}

function actualizarTotal() {
  let total = 0;
  gastos.forEach(b => b.items.forEach(g => total += g.monto));
  document.getElementById("totalGeneral").textContent = `💰 Total General: S/ ${total.toFixed(2)}`;
}

function exportarJSON() {
  const data = JSON.stringify(gastos, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gastos_guardados.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importarJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const datos = JSON.parse(e.target.result);
      if (Array.isArray(datos)) {
        gastos = datos;
        localStorage.setItem("gastos", JSON.stringify(gastos));
        mostrarBloques();
        actualizarTotal();
        alert("✅ Datos importados correctamente.");
      } else {
        throw new Error("Formato incorrecto");
      }
    } catch (err) {
      alert("❌ Error al importar JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}

let mesActual = new Date().getMonth();
let añoActual = new Date().getFullYear();

function generarCalendario() {
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const titulo = document.getElementById("tituloMes");
  titulo.textContent = `${meses[mesActual]} ${añoActual}`;

  const tabla = document.getElementById("calendarioTabla");
  tabla.innerHTML = "";

  const fecha = new Date(añoActual, mesActual, 1);
  const dias = [];

  while (fecha.getMonth() === mesActual) {
    dias.push(new Date(fecha));
    fecha.setDate(fecha.getDate() + 1);
  }

  let html = "<table><tr><th>Dom</th><th>Lun</th><th>Mar</th><th>Mie</th><th>Jue</th><th>Vie</th><th>Sab</th></tr><tr>";
  let diaSemana = dias[0].getDay();

  for (let i = 0; i < diaSemana; i++) html += "<td></td>";

  dias.forEach((d, i) => {
    const dStr = d.toLocaleDateString();
    const activo = dStr === diaSeleccionado ? "activo" : "";
    html += `<td class="${activo}" onclick="seleccionarDia('${dStr}')">${d.getDate()}</td>`;
    if ((i + diaSemana + 1) % 7 === 0) html += "</tr><tr>";
  });

  html += "</tr></table>";
  tabla.innerHTML = html;
}


function seleccionarDia(fecha) {
  diaSeleccionado = fecha;
  generarCalendario();
  mostrarBloques();
}

window.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("modoOscuroBtn");
  const modoGuardado = localStorage.getItem("modoOscuro") === "true";

  if (modoGuardado) {
    document.body.classList.add("dark");
    if (btn) btn.textContent = "☀️ Modo Claro";
  } else {
    document.body.classList.remove("dark");
    if (btn) btn.textContent = "🌗 Modo Oscuro";
  }

  saludoDinamico();
  generarCalendario();
  mostrarBloques();
  actualizarTotal();

  const sueldo = parseFloat(localStorage.getItem("sueldoMensual") || "0");
  document.getElementById("sueldoMostrado").textContent = sueldo.toFixed(2);
  document.getElementById("prevMes").addEventListener("click", () => {
    mesActual--;
    if (mesActual < 0) {
      mesActual = 11;
      añoActual--;
    }
    generarCalendario();
  });

  document.getElementById("nextMes").addEventListener("click", () => {
    mesActual++;
    if (mesActual > 11) {
      mesActual = 0;
      añoActual++;
    }
    generarCalendario();
  });

});

function exportarBloqueReporte(fecha) {
  const bloqueDOM = document.querySelector(`.bloque[data-fecha="${fecha}"]`);

  if (!bloqueDOM) {
    alert("No se encontró el bloque.");
    return;
  }

  const clone = bloqueDOM.cloneNode(true);
  clone.querySelectorAll("button").forEach(btn => btn.remove());

  const wrapper = document.createElement("div");
  wrapper.style.padding = "20px";
  wrapper.style.background = "#fff";
  wrapper.style.color = "#000";
  wrapper.style.fontFamily = "sans-serif";
  wrapper.style.fontSize = "14px";
  wrapper.appendChild(clone);

  document.body.appendChild(wrapper);
  html2canvas(wrapper).then(canvas => {
    const link = document.createElement("a");
    link.download = "Reporte_" + fecha.replaceAll("/", "-") + ".png";
    link.href = canvas.toDataURL();
    link.click();
    wrapper.remove();
  });
}