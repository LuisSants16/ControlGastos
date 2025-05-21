let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
let gastosTemporales = [];

function saludoDinamico() {
  const hora = new Date().getHours();
  let saludo = "¡Bienvenido!";
  if (hora >= 5 && hora < 12) saludo = "🌞 Buenos días";
  else if (hora < 18) saludo = "🌆 Buenas tardes";
  else saludo = "🌙 Buenas noches";
  document.getElementById("topBar").textContent = saludo + " | Control de Gastos Diario";
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("modoOscuro", document.body.classList.contains("dark"));
}

if (localStorage.getItem("modoOscuro") === "true") {
  document.body.classList.add("dark");
}

function agregarGasto() {
  const categoria = document.getElementById("categoria").value;
  const descripcion = document.getElementById("descripcion").value.trim();
  const monto = parseFloat(document.getElementById("monto").value);
  if (!descripcion || isNaN(monto)) return alert("Completa los datos.");
  const hora = new Date().toLocaleTimeString();
  gastosTemporales.push({ descripcion: categoria + " - " + descripcion, monto, hora });
  document.getElementById("descripcion").value = "";
  document.getElementById("monto").value = "";
  mostrarGastosTemporales();
}

function mostrarGastosTemporales() {
  const preview = document.getElementById("previewGastos");
  preview.innerHTML = "<h3>📝 Gastos por guardar:</h3>";
  gastosTemporales.forEach(g => {
    const div = document.createElement("div");
    div.className = "preview-item";
    div.innerHTML = `<span>${g.descripcion} (${g.hora})</span><span>S/ ${g.monto.toFixed(2)}</span>`;
    preview.appendChild(div);
  });
}

function guardarBloque() {
  if (gastosTemporales.length === 0) return alert("Agrega gastos antes.");
  const hoy = new Date().toLocaleDateString();
  const existe = gastos.find(b => b.fecha === hoy);
  if (existe) existe.items = existe.items.concat(gastosTemporales);
  else gastos.push({ fecha: hoy, items: [...gastosTemporales] });
  gastosTemporales = [];
  localStorage.setItem("gastos", JSON.stringify(gastos));
  mostrarGastosTemporales();
  mostrarBloques();
  actualizarTotal();
  actualizarGrafico();
  generarSugerenciaAI();
}

function editarGasto(bloqueIndex, gastoIndex) {
  const g = gastos[bloqueIndex].items[gastoIndex];
  const nuevaDescripcion = prompt("Editar descripción:", g.descripcion);
  const nuevoMonto = parseFloat(prompt("Editar monto:", g.monto));
  if (!nuevaDescripcion || isNaN(nuevoMonto)) return;
  g.descripcion = nuevaDescripcion;
  g.monto = nuevoMonto;
  localStorage.setItem("gastos", JSON.stringify(gastos));
  mostrarBloques();
  actualizarTotal();
  actualizarGrafico();
  generarSugerenciaAI();
}

function eliminarGasto(bloqueIndex, gastoIndex) {
  if (confirm("¿Eliminar este gasto?")) {
    gastos[bloqueIndex].items.splice(gastoIndex, 1);
    localStorage.setItem("gastos", JSON.stringify(gastos));
    mostrarBloques();
    actualizarTotal();
    actualizarGrafico();
    generarSugerenciaAI();
  }
}

function actualizarTotal() {
  let total = 0;
  gastos.forEach(b => b.items.forEach(g => total += g.monto));
  document.getElementById("totalGeneral").textContent = `💰 Total General: S/ ${total.toFixed(2)}`;
}

function mostrarAlertaGasto(subtotal) {
  const alerta = document.getElementById("alertaGasto");
  const sueldo = parseFloat(localStorage.getItem("sueldoMensual") || "0");
  if (sueldo > 0) {
    const diario = sueldo / 30;
    if (subtotal > diario) {
      alerta.textContent = "💸 CUIDADO: Te pasaste del presupuesto diario (S/ " + diario.toFixed(2) + ")";
      alerta.className = "alerta-gasto alerta-alta";
    } else if (subtotal > diario * 0.8) {
      alerta.textContent = "⚠️ Estás cerca del límite diario (S/ " + diario.toFixed(2) + ")";
      alerta.className = "alerta-gasto alerta-media";
    } else {
      alerta.textContent = "✅ Gasto dentro del presupuesto diario.";
      alerta.className = "alerta-gasto alerta-ok";
    }
  } else {
    alerta.textContent = "";
    alerta.className = "alerta-gasto";
  }
}

let chart;

function actualizarGrafico() {
  const ctx = document.getElementById('graficoGastos').getContext('2d');
  const sueldo = parseFloat(localStorage.getItem("sueldoMensual") || "0");
  const presupuestoDiario = sueldo > 0 ? sueldo / 30 : 0;

  const labels = gastos.map(g => g.fecha);
  const datos = gastos.map(g =>
    g.items.reduce((sum, item) => sum + item.monto, 0)
  );
  const presupuestos = new Array(gastos.length).fill(presupuestoDiario);

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Gasto Diario',
          data: datos,
          backgroundColor: 'rgba(255, 99, 132, 0.6)'
        },
        {
          label: 'Presupuesto Diario',
          data: presupuestos,
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function generarSugerenciaAI() {
  const div = document.getElementById("sugerenciaAI");
  const sueldo = parseFloat(localStorage.getItem("sueldoMensual") || "0");
  if (!sueldo || gastos.length === 0) {
    if (div) div.textContent = "";
    return;
  }

  const presupuestoDiario = sueldo / 30;
  let diasAltos = 0;
  let ahorro = 0;

  gastos.forEach(b => {
    const totalDia = b.items.reduce((sum, g) => sum + g.monto, 0);
    if (totalDia > presupuestoDiario) diasAltos++;
    else ahorro += presupuestoDiario - totalDia;
  });

  if (diasAltos >= 3) {
    div.textContent = "🔴 Has excedido tu presupuesto diario en varios días. Considera reducir gastos.";
  } else if (ahorro >= sueldo * 0.1) {
    div.textContent = "🟢 ¡Bien hecho! Estás ahorrando una buena parte de tu sueldo.";
  } else {
    div.textContent = "🟡 Tus gastos están dentro de lo normal.";
  }
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
        actualizarGrafico();
        generarSugerenciaAI();
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

function exportarBloqueReporte(index) {
  const bloque = document.querySelectorAll(".bloque")[index];
  if (!bloque) return;

  const clone = bloque.cloneNode(true);
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
    link.download = "Reporte_Bloque_" + (index + 1) + ".png";
    link.href = canvas.toDataURL();
    link.click();
    wrapper.remove();
  });
}

function guardarSueldo() {
  const sueldo = parseFloat(document.getElementById("sueldo").value);
  if (!isNaN(sueldo)) {
    localStorage.setItem("sueldoMensual", sueldo);
    const div = document.getElementById("sueldoMostrado");
    if (div) {
      div.textContent = "💼 Su sueldo es de: S/ " + sueldo.toFixed(2);
    }
    alert("💾 Sueldo guardado correctamente.");
    mostrarBloques();
  } else {
    alert("Ingresa un monto válido.");
  }
}

// Guardar visibilidad de bloques
function guardarVisibilidadBloques() {
  const visibilidad = {};
  document.querySelectorAll(".bloque").forEach((bloque, i) => {
    const fecha = gastos[i].fecha;
    const oculto = bloque.querySelector(".contenido-gastos").classList.contains("oculto");
    visibilidad[fecha] = oculto;
  });
  localStorage.setItem("visibilidadBloques", JSON.stringify(visibilidad));
}

function obtenerVisibilidadBloques() {
  try {
    return JSON.parse(localStorage.getItem("visibilidadBloques")) || {};
  } catch (e) {
    return {};
  }
}

function mostrarBloques() {
  const contenedor = document.getElementById("bloques");
  contenedor.innerHTML = "";
  const visibilidadGuardada = obtenerVisibilidadBloques();

  gastos.forEach((bloque, index) => {
    const div = document.createElement("div");
    div.className = "bloque";

    const titulo = document.createElement("h3");
    titulo.innerHTML = "📅 " + bloque.fecha;

    const toggleBtn = document.createElement("span");
    toggleBtn.innerHTML = "⬇️";
    toggleBtn.className = "toggle-btn";
    toggleBtn.title = "Ocultar/Mostrar gastos";

    const contenido = document.createElement("div");
    contenido.className = "contenido-gastos";
    if (visibilidadGuardada[bloque.fecha]) {
      contenido.classList.add("oculto");
      toggleBtn.innerHTML = "⬆️";
    }

    toggleBtn.onclick = () => {
      contenido.classList.toggle("oculto");
      toggleBtn.innerHTML = contenido.classList.contains("oculto") ? "⬆️" : "⬇️";
      guardarVisibilidadBloques();
    };

    titulo.appendChild(toggleBtn);
    div.appendChild(titulo);

    let subtotal = 0;

    bloque.items.forEach((g, i) => {
      const item = document.createElement("div");
      item.className = "bloque-item";
      item.innerHTML = `
        <span>${g.descripcion} (${g.hora})</span>
        <div class="gasto-acciones">
          <span>S/ ${g.monto.toFixed(2)}</span>
          <button class="btn-editar" onclick="editarGasto(${index}, ${i})">✏️</button>
          <button class="btn-eliminar" onclick="eliminarGasto(${index}, ${i})">❌</button>
        </div>`;
      contenido.appendChild(item);
      subtotal += g.monto;
    });

    const total = document.createElement("div");
    total.className = "bloque-total";
    total.textContent = `🧾 Total del día: S/ ${subtotal.toFixed(2)}`;
    mostrarAlertaGasto(subtotal);
    contenido.appendChild(total);

    const btnPDF = document.createElement("button");
    btnPDF.className = "btn-pdf";
    btnPDF.innerHTML = "📄 Reporte";
    btnPDF.onclick = () => exportarBloqueReporte(index);

    const btnBorrar = document.createElement("button");
    btnBorrar.className = "btn-eliminar";
    btnBorrar.innerHTML = "🗑️ Borrar bloque";
    btnBorrar.onclick = () => {
      if (confirm("¿Seguro que deseas borrar este bloque completo?")) {
        gastos.splice(index, 1);
        localStorage.setItem("gastos", JSON.stringify(gastos));
        mostrarBloques();
        actualizarTotal();
        actualizarGrafico();
        generarSugerenciaAI();
      }
    };

    const acciones = document.createElement("div");
    acciones.style.display = "flex";
    acciones.style.justifyContent = "flex-end";
    acciones.style.gap = "10px";
    acciones.style.marginTop = "10px";
    acciones.appendChild(btnPDF);
    acciones.appendChild(btnBorrar);

    contenido.appendChild(acciones);
    div.appendChild(contenido);
    contenedor.appendChild(div);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  saludoDinamico();
  mostrarBloques();
  actualizarTotal();
  actualizarGrafico();
  generarSugerenciaAI();

  const sueldoStr = localStorage.getItem("sueldoMensual");
  const sueldoGuardado = parseFloat(sueldoStr);
  const input = document.getElementById("sueldo");
  const div = document.getElementById("sueldoMostrado");

  if (!isNaN(sueldoGuardado) && sueldoStr !== null) {
    if (input) input.value = sueldoGuardado;
    if (div) div.textContent = "💼 Su sueldo es de: S/ " + sueldoGuardado.toFixed(2);
  } else {
    if (div) div.textContent = "💼 Su sueldo aún no ha sido ingresado.";
  }
});