// =======================================================
// CONFIGURACIÓN DE DIBUJOS PNG E HISTORIAL CLONADO
// =======================================================
const listaDibujos = [
    { id: "policia", src: "assets/img/dibujo-policia.png", nombre: "Fuerza Civil" },
    { id: "bombero", src: "assets/img/dibujo-bombero.png", nombre: "Bomberos" },
    { id: "paramedico", src: "assets/img/dibujo-paramedico.png", nombre: "Cruz Roja" },
    { id: "rescate", src: "assets/img/dibujo-rescate.png", nombre: "Protección Civil" }
];

let indiceDibujoActual = 0;
const canvas = document.getElementById('lienzo');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const container = document.getElementById('canvas-container');
let currentColor = '#D32F2F';

let historyStack = [];
const MAX_HISTORY = 10;

function guardarEstado() {
    if (historyStack.length >= MAX_HISTORY) {
        historyStack.shift();
    }
    // Creamos una copia completamente independiente de los pixeles actuales
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const clonedData = new ImageData(
        new Uint8ClampedArray(currentData.data),
        currentData.width,
        currentData.height
    );
    historyStack.push(clonedData);
}

function cargarImagenEnLienzo() {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const overlay = document.getElementById('mandala-overlay');
    if (overlay.complete && overlay.naturalWidth !== 0) {
        dibujarImagenProporcional(overlay);
        historyStack = []; 
        guardarEstado(); 
    } else {
        overlay.onload = () => {
            dibujarImagenProporcional(overlay);
            historyStack = [];
            guardarEstado(); 
        };
    }
}

function dibujarImagenProporcional(img) {
    let hRatio = canvas.width / img.naturalWidth;
    let vRatio = canvas.height / img.naturalHeight;
    let ratio = Math.min(hRatio, vRatio);
    
    let centerShiftX = (canvas.width - img.naturalWidth * ratio) / 2;
    let centerShiftY = (canvas.height - img.naturalHeight * ratio) / 2;
    
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 
                       centerShiftX, centerShiftY, img.naturalWidth * ratio, img.naturalHeight * ratio);
}

// =======================================================
// REDIMENSIONADO DEL LIENZO (a prueba de iPad)
// En iPad/Safari, el evento 'resize' se dispara con mucha
// frecuencia (al mostrarse/ocultarse la barra de direcciones,
// al girar la pantalla, etc.). Antes, cada resize volvía a
// cargar el dibujo en blanco y el niño perdía su trabajo.
// Ahora: en la primera carga se dibuja el mandala en blanco;
// en cualquier resize posterior se conserva lo ya pintado.
// =======================================================
let lienzoListo = false;
let ultimoAncho = 0;
let ultimoAlto = 0;
let resizeTimer = null;

function redimensionarCanvasInicial() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    ultimoAncho = canvas.width;
    ultimoAlto = canvas.height;
    lienzoListo = true;
    cargarImagenEnLienzo();
}

function redimensionarCanvasPreservando() {
    if (!lienzoListo) { redimensionarCanvasInicial(); return; }

    const nuevoAncho = container.clientWidth;
    const nuevoAlto = container.clientHeight;

    // Ignoramos cambios diminutos (p.ej. cuando en iPad aparece/
    // desaparece la barra de Safari, que mueve unos pixeles el alto)
    if (Math.abs(nuevoAncho - ultimoAncho) < 5 && Math.abs(nuevoAlto - ultimoAlto) < 5) {
        return;
    }

    let snapshot = null;
    try { snapshot = canvas.toDataURL(); } catch (err) { snapshot = null; }

    canvas.width = nuevoAncho;
    canvas.height = nuevoAlto;
    ultimoAncho = nuevoAncho;
    ultimoAlto = nuevoAlto;

    if (!snapshot) {
        cargarImagenEnLienzo();
        return;
    }

    const img = new Image();
    img.onload = () => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        dibujarImagenProporcional(img);
        // El historial de deshacer se reinicia porque cambió el
        // tamaño del lienzo, pero el dibujo del niño NO se pierde.
        historyStack = [];
        guardarEstado();
    };
    img.onerror = () => { cargarImagenEnLienzo(); };
    img.src = snapshot;
}

function onWindowResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(redimensionarCanvasPreservando, 200);
}

window.addEventListener('resize', onWindowResize);
window.addEventListener('orientationchange', () => {
    setTimeout(redimensionarCanvasPreservando, 300);
});
window.addEventListener('load', redimensionarCanvasInicial);

function cambiarDibujo(direccion) {
    const snd = document.getElementById('sndClick');
    if (snd) { snd.currentTime = 0; snd.play(); }

    indiceDibujoActual += direccion;
    if (indiceDibujoActual < 0) indiceDibujoActual = listaDibujos.length - 1;
    if (indiceDibujoActual >= listaDibujos.length) indiceDibujoActual = 0;

    const overlay = document.getElementById('mandala-overlay');
    overlay.src = listaDibujos[indiceDibujoActual].src;

    document.getElementById('drawing-name').textContent = listaDibujos[indiceDibujoActual].nombre;
    cargarImagenEnLienzo();
}

const colorButtons = document.querySelectorAll('.color-btn');
colorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const snd = document.getElementById('sndClick');
        if (snd) { snd.currentTime = 0; snd.play(); }
        colorButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentColor = btn.dataset.color;
    });
});

// =======================================================
// BOTE DE PINTURA (FLOOD FILL)
// =======================================================
function hexToRgb(hex) {
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16)
    };
}

function fillCanvas(e) {
    e.preventDefault();

    // PointerEvent trae clientX/clientY de forma uniforme sin importar
    // si el toque viene de mouse, dedo o lápiz (funciona igual en
    // laptop, PC con pantalla táctil e iPad).
    const rect = canvas.getBoundingClientRect();
    const startX = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const startY = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

    const fillColor = hexToRgb(currentColor);
    let imageData;

    try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (err) {
        alert("Asegúrate de abrir el navegador con el permiso --allow-file-access-from-files");
        return;
    }

    const data = imageData.data;
    const startPos = (startY * canvas.width + startX) * 4;
    const targetR = data[startPos];
    const targetG = data[startPos + 1];
    const targetB = data[startPos + 2];

    if (targetR < 60 && targetG < 60 && targetB < 60) return;
    if (targetR === fillColor.r && targetG === fillColor.g && targetB === fillColor.b) return;

    // GUARDAR ESTADO ANTES DE APLICAR EL NUEVO COLOR
    guardarEstado();

    function matchTarget(pos) {
        const r = data[pos], g = data[pos+1], b = data[pos+2];
        if (r < 60 && g < 60 && b < 60) return false;
        const diff = Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB);
        return diff < 120;
    }

    const stack = [startX, startY];
    const visited = new Uint8Array(canvas.width * canvas.height);

    while (stack.length > 0) {
        const y = stack.pop();
        const x = stack.pop();
        const idx = y * canvas.width + x;

        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
        if (visited[idx]) continue;

        const pos = idx * 4;
        if (matchTarget(pos)) {
            visited[idx] = 1;
            data[pos] = fillColor.r;
            data[pos+1] = fillColor.g;
            data[pos+2] = fillColor.b;
            data[pos+3] = 255;

            stack.push(x + 1, y);
            stack.push(x - 1, y);
            stack.push(x, y + 1);
            stack.push(x, y - 1);
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

canvas.addEventListener('pointerdown', fillCanvas, { passive: false });

// =======================================================
// BOTONES DE CONTROL (DESHACER Y BORRAR)
// =======================================================
function deshacerPaso() {
    const snd = document.getElementById('sndClick');
    if (snd) { snd.currentTime = 0; snd.play(); }

    if (historyStack.length > 1) {
        historyStack.pop(); // Elimina el estado actual
        const estadoAnterior = historyStack[historyStack.length - 1]; // Toma el previo exacto
        ctx.putImageData(estadoAnterior, 0, 0);
    }
}

function limpiarLienzo() {
    const snd = document.getElementById('sndClick');
    if (snd) { snd.currentTime = 0; snd.play(); }
    cargarImagenEnLienzo(); 
}

// =======================================================
// FINALIZAR DIBUJO
// =======================================================
function finalizarDibujo() {
    const contenedorFinal = document.getElementById('final-artwork');
    contenedorFinal.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'final-composition';

    const canvasPintura = document.createElement('canvas');
    canvasPintura.width = canvas.width;
    canvasPintura.height = canvas.height;
    canvasPintura.getContext('2d').drawImage(canvas, 0, 0);

    const dibujoOriginal = document.getElementById('mandala-overlay');
    const imagenLíneas = dibujoOriginal.cloneNode();

    wrapper.appendChild(canvasPintura);
    wrapper.appendChild(imagenLíneas);
    contenedorFinal.appendChild(wrapper);

    document.querySelector('.drawing-layout').style.display = 'none';
    document.getElementById('success-screen').classList.replace('hidden', 'active');
}

function reiniciarDibujo() {
    document.getElementById('success-screen').classList.replace('active', 'hidden');
    document.querySelector('.drawing-layout').style.display = 'flex';
    // El contenedor estaba oculto (display:none) mientras se mostraba el
    // diploma, así que su tamaño pudo no medirse bien; lo recalculamos.
    ultimoAncho = 0; ultimoAlto = 0;
    redimensionarCanvasPreservando();
    limpiarLienzo();
}

// =======================================================
// MÚSICA DE FONDO (FORZADA EN INTERACCIONES CLAVE)
// =======================================================
let musicaIniciada = false;

function iniciarMusicaFondo() {
    if (musicaIniciada) return; // Si ya está sonando, no hacemos nada
    
    const bgMusic = document.getElementById('bgMusic');
    if (bgMusic && bgMusic.paused) {
        bgMusic.volume = 0.3; // Volumen suave al 30%
        let playPromise = bgMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                musicaIniciada = true; // Éxito al reproducir
            }).catch(error => {
                console.log("El navegador bloqueó el autoplay, esperando otra interacción.");
            });
        }
    }
}

// Escuchamos clics generales en la pantalla
document.body.addEventListener('click', iniciarMusicaFondo);
document.body.addEventListener('touchstart', iniciarMusicaFondo);

// También forzamos el intento al tocar directamente el lienzo de dibujo
canvas.addEventListener('click', iniciarMusicaFondo);
canvas.addEventListener('touchstart', iniciarMusicaFondo, { passive: true });