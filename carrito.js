// ------------------- CONFIGURACIÓN -------------------
const tuNumeroDeWhatsApp = '2482000310'; // ⚠️ Reemplaza con tu número

const OFERTAS_POR_FAMILIA = {
  'pall-mall': { precioNormal: 78.00, precioOferta: 77.00, cantidadMinima: 5 },
  'marlboro-rojo': { precioNormal: 85.00, precioOferta: 81.50, cantidadMinima: 5 },
  'marlboro-vista': { precioNormal: 78.00, precioOferta: 74.00, cantidadMinima: 5 }
};

// ------------------- LÓGICA DEL CARRITO -------------------
let carrito = JSON.parse(localStorage.getItem('miCarrito')) || [];

function guardarCarrito() {
  localStorage.setItem('miCarrito', JSON.stringify(carrito));
}

// ========= FUNCIÓN CORREGIDA Y ROBUSTA =========
function agregarAlCarrito(boton) {
  // Busca el ancestro más cercano que contenga la información del producto (data-id)
  const productoDiv = boton.closest('[data-id]');

  if (!productoDiv) {
    console.error("Error: No se encontró el contenedor del producto (con data-id).");
    return;
  }

  const id = productoDiv.dataset.id;
  const nombre = productoDiv.dataset.nombre;
  const precio = parseFloat(productoDiv.dataset.precio);
  const familia = productoDiv.dataset.family || null;
  const ofertaPrecio = parseFloat(productoDiv.dataset.ofertaPrecio) || null;
  const ofertaCantidad = parseInt(productoDiv.dataset.ofertaCantidad) || null;

  const cantidadInput = productoDiv.querySelector('.quantity-to-add');
  const cantidad = parseInt(cantidadInput.value);

  if (isNaN(cantidad) || cantidad < 1) {
    alert("Por favor, ingresa una cantidad válida.");
    return;
  }

  const productoEnCarrito = carrito.find(item => item.id === id);
  if (productoEnCarrito) {
    productoEnCarrito.cantidad += cantidad;
  } else {
    carrito.push({ id, nombre, precio, cantidad, familia, ofertaPrecio, ofertaCantidad });
  }
  
  cantidadInput.value = 1;
  guardarCarrito();
  actualizarCarritoUI();
}
// ======================================

// Esta función es para los botones que no tienen selector de cantidad
function agregarAlCarritoSimple(id, nombre, precio) {
    const productoEnCarrito = carrito.find(item => item.id === id);
    if(productoEnCarrito){
        productoEnCarrito.cantidad++;
    } else {
        carrito.push({ id, nombre, precio, cantidad: 1, familia: null });
    }
    guardarCarrito();
    actualizarCarritoUI();
}

function modificarCantidad(id, cambio) {
  const productoEnCarrito = carrito.find(item => item.id === id);
  if (productoEnCarrito) {
    productoEnCarrito.cantidad += cambio;
    if (productoEnCarrito.cantidad <= 0) {
      carrito = carrito.filter(item => item.id !== id);
    }
  }
  guardarCarrito();
  actualizarCarritoUI();
}

function calcularPreciosYActualizarUI() {
  const carritoItemsDiv = document.getElementById('carrito-items');
  const carritoTotalDiv = document.getElementById('carrito-total');
  const contadorCarrito = document.getElementById('contador-carrito');

  if (!carritoItemsDiv) return;

  const cantidadesPorFamilia = {};
  for (const familia in OFERTAS_POR_FAMILIA) {
      cantidadesPorFamilia[familia] = carrito.filter(item => item.familia === familia).reduce((sum, item) => sum + item.cantidad, 0);
  }

  carritoItemsDiv.innerHTML = '';
  let totalGeneral = 0;
  let totalItems = 0;

  if (carrito.length === 0) {
    carritoItemsDiv.innerHTML = '<p class="text-gray-500">Tu carrito está vacío.</p>';
  } else {
    carrito.forEach(item => {
      let precioUnitario = item.precio;
      let notaPrecio = "";
      
      if (item.familia && OFERTAS_POR_FAMILIA[item.familia]) {
        const oferta = OFERTAS_POR_FAMILIA[item.familia];
        if (cantidadesPorFamilia[item.familia] >= oferta.cantidadMinima) {
          precioUnitario = oferta.precioOferta;
          notaPrecio = ` <span class="text-xs text-blue-500">(Oferta Familia)</span>`;
        }
      } else if (item.ofertaPrecio && item.ofertaCantidad && item.cantidad >= item.ofertaCantidad) {
        precioUnitario = item.ofertaPrecio;
        notaPrecio = ` <span class="text-xs text-blue-500">(Oferta)</span>`;
      }

      const subtotal = precioUnitario * item.cantidad;
      totalGeneral += subtotal;
      totalItems += item.cantidad;

      const itemHtml = `<div class="flex justify-between items-center mb-2"><div><p class="font-semibold">${item.nombre}${notaPrecio}</p><p class="text-sm text-gray-600">${item.cantidad} x $${precioUnitario.toFixed(2)}</p></div><div class="flex items-center gap-2"><span class="font-bold w-20 text-right">$${subtotal.toFixed(2)}</span><button onclick="modificarCantidad('${item.id}', -1)" class="bg-gray-200 px-2 rounded">-</button><button onclick="modificarCantidad('${item.id}', 1)" class="bg-gray-200 px-2 rounded">+</button></div></div>`;
      carritoItemsDiv.innerHTML += itemHtml;
    });
  }
  
  if (carritoTotalDiv) carritoTotalDiv.innerText = `Total: $${totalGeneral.toFixed(2)}`;
  if (contadorCarrito) contadorCarrito.innerText = totalItems;
}

function actualizarCarritoUI() {
    calcularPreciosYActualizarUI();
}

function mostrarCarrito() { document.getElementById('modal-carrito').classList.remove('hidden'); }
function ocultarCarrito() { document.getElementById('modal-carrito').classList.add('hidden'); }

function enviarPedido() {
    if (carrito.length === 0) { alert('Tu carrito está vacío.'); return; }

    const cantidadesPorFamilia = {};
    for (const familia in OFERTAS_POR_FAMILIA) {
        cantidadesPorFamilia[familia] = carrito.filter(item => item.familia === familia).reduce((sum, item) => sum + item.cantidad, 0);
    }

    let mensaje = `*Resumen de Pedido:* 🛒\n\n*Productos:*\n`;
    let totalGeneral = 0;
    const familiasConOfertaAplicada = new Set();

    carrito.forEach(item => {
        let precioUnitario = item.precio;
        if (item.familia && OFERTAS_POR_FAMILIA[item.familia]) {
            const oferta = OFERTAS_POR_FAMILIA[item.familia];
            if (cantidadesPorFamilia[item.familia] >= oferta.cantidadMinima) {
                precioUnitario = oferta.precioOferta;
                familiasConOfertaAplicada.add(item.familia);
            }
        } else if (item.ofertaPrecio && item.ofertaCantidad && item.cantidad >= item.ofertaCantidad) {
            precioUnitario = item.ofertaPrecio;
        }

        const subtotal = precioUnitario * item.cantidad;
        mensaje += `• ${item.nombre} (${item.cantidad} x $${precioUnitario.toFixed(2)}) = *$${subtotal.toFixed(2)}*\n`;
        totalGeneral += subtotal;
    });

    if (familiasConOfertaAplicada.size > 0) {
        mensaje += `\n_Se aplicó oferta en: ${Array.from(familiasConOfertaAplicada).join(', ')}._\n`;
    }

    mensaje += `--------------------\n*TOTAL: $${totalGeneral.toFixed(2)}*\n\n¡Gracias por tu compra!`;
    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${tuNumeroDeWhatsApp}&text=${mensajeCodificado}`;
    window.open(urlWhatsApp, '_blank');
}


document.addEventListener('DOMContentLoaded', actualizarCarritoUI);

