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

  const puedeSubir = i > 0;
  const puedeBajar = i < bloque.items.length - 1;

  if (g.editando) {
  item.classList.add("editando");
  item.innerHTML = `
    <select id="editCat${g.id}">
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
    </select>
    <input type="text" id="editDesc${g.id}" value="${g.descripcion.split(' - ')[1] || ''}" placeholder="Descripción" />
    <input type="number" id="editMonto${g.id}" value="${g.monto}" placeholder="Monto (S/.)" />
    <div class="edit-botones">
      <button onclick="confirmarEdicionInline('${bloque.fecha}', ${i})">✔️</button>
      <button onclick="cancelarEdicionInline('${bloque.fecha}', ${i})">❌</button>
    </div>
  `;

    setTimeout(() => {
      document.getElementById(`editCat${g.id}`).value = g.descripcion.split(" - ")[0];
      document.getElementById(`editDesc${g.id}`).focus();
    }, 10);

  } else {
    item.innerHTML = `
      <span>${g.descripcion} (${g.hora})</span>
      <div class="gasto-acciones">
        <span>S/ ${g.monto.toFixed(2)}</span>
        ${i > 0 ? `<button onclick="moverGasto('${bloque.fecha}', ${i}, 'up')">⬆️</button>` : ""}
        ${i < bloque.items.length - 1 ? `<button onclick="moverGasto('${bloque.fecha}', ${i}, 'down')">⬇️</button>` : ""}
        <button onclick="editarGastoInline('${bloque.fecha}', ${i})">✏️</button>
        <button onclick="eliminarGasto('${bloque.fecha}', ${i})">❌</button>
      </div>
    `;
  }

    div.appendChild(item);
    subtotal += g.monto;
  });

  const total = document.createElement("div");
  total.className = "bloque-total";
  total.textContent = `🧾 Total del día: S/ ${subtotal.toFixed(2)}`;
  div.appendChild(total);
  contenedor.appendChild(div);

  const sueldo = parseFloat(localStorage.getItem("sueldoMensual") || "0");
  const limiteDiario = sueldo / 30;

  const mensaje = document.createElement("div");
  mensaje.style.padding = "10px";
  mensaje.style.marginTop = "10px";
  mensaje.style.borderRadius = "8px";
  mensaje.style.fontWeight = "bold";
  mensaje.style.textAlign = "center";

  if (limiteDiario > 0) {
    if (subtotal > limiteDiario) {
      mensaje.textContent = `⚠️ ¡Has superado el gasto diario sugerido de S/ ${limiteDiario.toFixed(2)}!`;
      mensaje.style.backgroundColor = "#ff5252aa";
    } else {
      mensaje.textContent = `✅ Vas bien. Has gastado S/ ${subtotal.toFixed(2)} de un máximo sugerido de S/ ${limiteDiario.toFixed(2)}.`;
      mensaje.style.backgroundColor = "#4caf5099";
    }
    div.insertBefore(mensaje, total);
  }

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
    btnGroup.className = "btn-group";
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

function editarGastoInline(fecha, index) {
  const bloque = gastos.find(b => b.fecha === fecha);
  if (!bloque) return;
  bloque.items[index].editando = true;
  mostrarBloques();
}

function cancelarEdicionInline(fecha, index) {
  const bloque = gastos.find(b => b.fecha === fecha);
  if (!bloque) return;
  delete bloque.items[index].editando;
  mostrarBloques();
}

function confirmarEdicionInline(fecha, index) {
  const bloque = gastos.find(b => b.fecha === fecha);
  if (!bloque) return;

  const g = bloque.items[index];
  const cat = document.getElementById(`editCat${g.id}`).value;
  const desc = document.getElementById(`editDesc${g.id}`).value.trim();
  const monto = parseFloat(document.getElementById(`editMonto${g.id}`).value);

  if (!desc || isNaN(monto)) {
    alert("Completa todos los campos.");
    return;
  }

  g.descripcion = `${cat} - ${desc}`;
  g.monto = monto;
  delete g.editando;

  localStorage.setItem("gastos", JSON.stringify(gastos));
  mostrarBloques();
  actualizarTotal();
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

function moverGasto(fecha, index, direccion) {
  const bloque = gastos.find(b => b.fecha === fecha);
  if (!bloque) return;

  let nuevoIndex = index;
  let tipoMovimiento = null;

  if (direccion === 'up' && index > 0) {
    [bloque.items[index - 1], bloque.items[index]] = [bloque.items[index], bloque.items[index - 1]];
    nuevoIndex = index - 1;
    tipoMovimiento = 'subio';
  } else if (direccion === 'down' && index < bloque.items.length - 1) {
    [bloque.items[index + 1], bloque.items[index]] = [bloque.items[index], bloque.items[index + 1]];
    nuevoIndex = index + 1;
    tipoMovimiento = 'bajo';
  } else {
    return;
  }

  localStorage.setItem("gastos", JSON.stringify(gastos));
  mostrarBloques();

  setTimeout(() => {
    const bloquesDOM = document.querySelectorAll(".bloque");
    bloquesDOM.forEach(b => {
      const items = b.querySelectorAll(".bloque-item");
      const item1 = items[nuevoIndex];
      const item2 = items[index];

      if (item1) {
        item1.classList.add(tipoMovimiento === 'subio' ? 'gasto-subio' : 'gasto-bajo');
        setTimeout(() => item1.classList.remove(tipoMovimiento === 'subio' ? 'gasto-subio' : 'gasto-bajo'), 1000);
      }

      if (item2) {
        item2.classList.add(tipoMovimiento === 'subio' ? 'gasto-bajo' : 'gasto-subio');
        setTimeout(() => item2.classList.remove(tipoMovimiento === 'subio' ? 'gasto-bajo' : 'gasto-subio'), 1000);
      }
    });
  }, 100);
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
    mostrarBloques();
    generarResumenMensual();
  });

  document.getElementById("nextMes").addEventListener("click", () => {
    mesActual++;
    if (mesActual > 11) {
      mesActual = 0;
      añoActual++;
    }
    generarCalendario();
    mostrarBloques();
    generarResumenMensual();
  });

});

function exportarBloqueReporte(fecha) {
  const contenedor = document.querySelector(`.bloque[data-fecha="${fecha}"]`);
  if (!contenedor) return;

  document.querySelectorAll(".menu-reporte").forEach(e => e.remove());

  const opciones = document.createElement("div");
  opciones.className = "menu-reporte";
  opciones.innerHTML = `
    <button onclick="generarImagen('${fecha}')">📷 Imagen</button>
    <button onclick="generarPDF('${fecha}')">📑 PDF</button>
    <button onclick="generarExcel('${fecha}')">📊 Excel</button>
  `;

  const btnReporte = contenedor.querySelector(".btn-reporte");
  if (!btnReporte) return;

  const rect = btnReporte.getBoundingClientRect();
  document.body.appendChild(opciones);

  opciones.style.top = `${rect.top + window.scrollY - opciones.offsetHeight - 10}px`;
  opciones.style.left = `${rect.left + window.scrollX}px`;

  setTimeout(() => {
    window.addEventListener("click", () => {
      opciones.remove();
    }, { once: true });
  }, 100);
}

function generarImagen(fecha) {
  const bloqueDOM = document.querySelector(`.bloque[data-fecha="${fecha}"]`);
  if (!bloqueDOM) return;

  const clone = bloqueDOM.cloneNode(true);
  clone.querySelectorAll("button").forEach(btn => btn.remove());

  const wrapper = document.createElement("div");
  wrapper.className = "modo-claro-temporal";
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

function generarPDF(fecha) {
  const bloque = gastos.find(b => b.fecha === fecha);
  if (!bloque) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("📄 Reporte de Gasto Diario", 20, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`📅 Fecha: ${fecha}`, 20, y);
  y += 10;

  bloque.items.forEach(g => {
    doc.text(`• ${g.descripcion}`, 20, y); y += 6;
    doc.text(`   Hora: ${g.hora}    Monto: S/ ${g.monto.toFixed(2)}`, 22, y); y += 7;
  });

  y += 5;
  const total = bloque.items.reduce((acc, g) => acc + g.monto, 0);
  doc.setFont("helvetica", "bold");
  doc.text(`🧾 Total del día: S/ ${total.toFixed(2)}`, 20, y);

  doc.save(`Reporte_${fecha.replaceAll("/", "-")}.pdf`);
}

function generarExcel(fecha) {
  const bloque = gastos.find(b => b.fecha === fecha);
  if (!bloque) return;

  const data = [
    ["REPORTE DE GASTOS"],
    [`Fecha: ${fecha}`],
    [],
    ["Descripción", "Hora", "Monto (S/)"],
    ...bloque.items.map(g => [
      g.descripcion,
      g.hora,
      Number(g.monto)
    ])
  ];

  const total = bloque.items.reduce((acc, g) => acc + g.monto, 0);
  data.push([]);
  data.push(["", "Total del día", total]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Gastos");

  XLSX.writeFile(wb, `Reporte_${fecha.replaceAll("/", "-")}.xlsx`);
}

function generarResumenMensual() {
  const resumenContenedor = document.getElementById("resumenMensual");
  resumenContenedor.innerHTML = "";

  const mes = mesActual + 1;
  const año = añoActual;

  const gastosMes = gastos.filter(b => {
    const [dia, mesG, añoG] = b.fecha.split("/").map(n => parseInt(n));
    return mesG === mes && añoG === año;
  });

  if (gastosMes.length === 0) {
    resumenContenedor.innerHTML = "<p>No hay datos para este mes.</p>";
    return;
  }

  let total = 0;
  const categorias = {};
  const dias = {};

  gastosMes.forEach(b => {
    const dia = b.fecha;
    dias[dia] = dias[dia] || 0;

    b.items.forEach(g => {
      total += g.monto;

      const categoria = g.descripcion.split(" - ")[0].trim();
      categorias[categoria] = (categorias[categoria] || 0) + 1;
      dias[dia] += g.monto;
    });
  });

  let categoriaMasUsada = "";
  let maxUsos = 0;
  for (const cat in categorias) {
    if (categorias[cat] > maxUsos) {
      categoriaMasUsada = cat;
      maxUsos = categorias[cat];
    }
  }

  let diaMasCaro = "";
  let maxDia = 0;
  for (const d in dias) {
    if (dias[d] > maxDia) {
      maxDia = dias[d];
      diaMasCaro = d;
    }
  }

  const promedio = total / gastosMes.length;

  resumenContenedor.innerHTML = `
    <h3 style="margin-bottom: 15px; font-size: 20px">📅 Resumen de ${getNombreMes(mes)} ${año}</h3>
    <div class="linea-resumen">💰 <strong>Total gastado:</strong> S/ ${total.toFixed(2)}</div>
    <div class="linea-resumen">🍔 <strong>Categoría más usada:</strong> ${categoriaMasUsada}</div>
    <div class="linea-resumen">📅 <strong>Día más costoso:</strong> ${diaMasCaro} (S/ ${maxDia.toFixed(2)})</div>
    <div class="linea-resumen">📊 <strong>Promedio diario:</strong> S/ ${promedio.toFixed(2)}</div>
  `;
}

function getNombreMes(numero) {
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return meses[numero - 1] || "";
}

generarResumenMensual();

function subirJSONaDriveYCompartir() {
  const contenido = JSON.stringify(gastos, null, 2);
  const data = {
    contenido: contenido,
    nombreArchivo: "reporte_gastos_" + Date.now() + ".json"
  };

  fetch("https://script.google.com/macros/s/AKfycbw-TCDdjGehoggzuamc_YinQzjmqRWf_bKolTC4kk_K6dZi8BmGgHFT10AFLO01eGBHAA/exec", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(res => res.text())
  .then(link => {
    const mensaje = encodeURIComponent(`📎 Aquí está tu reporte JSON:\n${link}`);
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  })
  .catch(err => alert("Error al subir: " + err));
}
