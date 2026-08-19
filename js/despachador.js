// Agregamos más escenarios locales para mayor variedad
const emergenciasBase = [
    { texto: "¡Una persona sospechosa afuera de tu casa!", solucion: "policia", imagen: "url('assets/img/emergencia-sospechoso.jpg')" },
    { texto: "¡Hay un incendio forestal en el cerro!", solucion: "bomberos", imagen: "url('assets/img/emergencia-incendio.jpg')" },
    { texto: "¡Una persona sufre una caída!", solucion: "medico", imagen: "url('assets/img/emergencia-caida.jpg')" },
    { texto: "¡Un árbol cae afuera de escuela!", solucion: "rescate", imagen: "url('assets/img/emergencia-arbol.jpg')" },
    { texto: "¡Hay un poste de madera que esta arrojando chipas!", solucion: "rescate", imagen: "url('assets/img/corto_circuito.jpg')" },
    { texto: "¡Observan una pelea entre vecinos alcoholizados!", solucion: "policia", imagen: "url('assets/img/emergencia-pelea.jpg')" },
    { texto: "¡Observan a una persona sangrando de la cabeza!", solucion: "medico", imagen: "url('assets/img/emergencia-sangrando.jpg')" },
    { texto: "¡Al caminar observan a un gatito en un arbol y no puede bajar!", solucion: "rescate", imagen: "url('assets/img/emergencia-gatito.jpg')" }
];

let emergenciasPendientes = [];
let emergenciaActual = {};
const sndClick = document.getElementById('sndClick'), 
      sndMatch = document.getElementById('sndMatch'), 
      sndError = document.getElementById('sndError');

// Función para barajar los escenarios aleatoriamente sin repetirlos
function mezclarArreglo(arreglo) {
    let mezclado = [...arreglo];
    for (let i = mezclado.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mezclado[i], mezclado[j]] = [mezclado[j], mezclado[i]];
    }
    return mezclado;
}

function iniciarJuego() {
    // Llenamos la bandeja de emergencias y las barajamos
    emergenciasPendientes = mezclarArreglo(emergenciasBase);
    cargarEmergencia();
}

function cargarEmergencia() {
    // Sacamos el último escenario de la lista (para no repetirlo)
    emergenciaActual = emergenciasPendientes.pop();
    
    document.getElementById('emergencia-texto').textContent = emergenciaActual.texto;
    document.getElementById('emergencia-img').style.backgroundImage = emergenciaActual.imagen;
    document.getElementById('emergencia-zona').classList.remove('error');
}

function seleccionarVehiculo(tipo) {
    if(sndClick) { sndClick.currentTime = 0; sndClick.play(); }
    
    if(tipo === emergenciaActual.solucion) {
        if(sndMatch) { sndMatch.currentTime = 0; sndMatch.play(); }
        
        // Verificamos si ya completó todas las emergencias
        if(emergenciasPendientes.length === 0) {
            // Muestra el Gran Diploma Final
            document.getElementById('final-screen').classList.replace('hidden', 'active');
        } else {
            // Muestra la pantalla de éxito intermedia
            document.getElementById('success-screen').classList.replace('hidden', 'active');
        }
    } else {
        if(sndError) { sndError.currentTime = 0; sndError.play(); }
        const zona = document.getElementById('emergencia-zona');
        zona.classList.remove('error'); void zona.offsetWidth; zona.classList.add('error');
    }
}

function siguienteEmergencia() {
    document.getElementById('success-screen').classList.replace('active', 'hidden');
    cargarEmergencia();
}

function reiniciarJuego() {
    document.getElementById('final-screen').classList.replace('active', 'hidden');
    iniciarJuego();
}

window.onload = iniciarJuego;