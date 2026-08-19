// Generamos el pool de 15 imágenes en formato PNG
const poolImagenes = Array.from({length: 15}, (_, i) => `carta${i + 1}.png`);

let players = [], currentPlayer = 0, firstCard = null, secondCard = null, lockBoard = false;
let pairsFound = 0, activePairsCount = 0, numJugadoresSeleccionado = 1;

const audios = {
    bg: document.getElementById('bgMusic'), 
    click: document.getElementById('sndClick'),
    match: document.getElementById('sndMatch'), 
    error: document.getElementById('sndError'), 
    win: document.getElementById('sndWin')
};

function playSound(type) { 
    if(audios[type]) { 
        audios[type].currentTime = 0; 
        audios[type].play().catch(()=>console.log("Audio req interact")); 
    } 
}

// =========================================================
// PASO 1: PANTALLA PARA INGRESAR NOMBRES
// =========================================================
function pedirNombres(numPlayers) {
    playSound('click');
    numJugadoresSeleccionado = numPlayers;
    
    const container = document.getElementById('names-inputs-container');
    container.innerHTML = ''; 
    
    for(let i = 1; i <= numPlayers; i++) {
        container.innerHTML += `
            <div class="name-input-group">
                <label>Nombre del Jugador ${i}:</label>
                <input type="text" id="nombre-j${i}" placeholder="Ej. Carlos" maxlength="12" autocomplete="off">
            </div>
        `;
    }
    
    document.getElementById('lobby-screen').classList.replace('active', 'hidden');
    document.getElementById('names-screen').classList.replace('hidden', 'active');
}

// =========================================================
// PASO 2: INICIAR EL JUEGO FINAL
// =========================================================
function iniciarJuegoFinal() {
    playSound('click');
    audios.bg.volume = 0.3; 
    audios.bg.play().catch(()=>console.log("Esperando tap para música"));
    
    players = [];
    
    // Guardar nombres
    for(let i = 1; i <= numJugadoresSeleccionado; i++) {
        let inputNombre = document.getElementById(`nombre-j${i}`).value.trim();
        let nombreFinal = inputNombre === "" ? `Jugador ${i}` : inputNombre;
        players.push({ id: i, nombre: nombreFinal, score: 0 });
    }
    
    currentPlayer = 0; 
    pairsFound = 0;

    // Asignar el total de pares
    if (numJugadoresSeleccionado === 1) activePairsCount = 8;       // 16 cartas
    else if (numJugadoresSeleccionado === 2) activePairsCount = 10; // 20 cartas
    else if (numJugadoresSeleccionado === 3) activePairsCount = 12; // 24 cartas
    else if (numJugadoresSeleccionado === 4) activePairsCount = 15; // 30 cartas

    document.getElementById('names-screen').classList.replace('active', 'hidden');
    document.getElementById('game-screen').classList.replace('hidden', 'active');
    
    actualizarMarcador(); 
    crearTablero(activePairsCount);
}

// =========================================================
// PASO 3: CREAR EL TABLERO DINÁMICO
// =========================================================
function crearTablero(numPairs) {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    
    // Multiplicamos por 2 para saber la clase CSS de las columnas (16, 20, 24, 30)
    let totalCartas = numPairs * 2;
    board.className = `board grid-${totalCartas}`;

    let imagenesActivas = poolImagenes.slice(0, numPairs);
    let cards = [...imagenesActivas, ...imagenesActivas].sort(() => Math.random() - 0.5);

    cards.forEach(imgName => {
        const card = document.createElement('div');
        card.classList.add('card'); 
        card.dataset.name = imgName;
        
        const imgElement = document.createElement('img');
        imgElement.src = `assets/img/${imgName}`;
        
        card.appendChild(imgElement);
        card.addEventListener('click', voltearCarta);
        board.appendChild(card);
    });
}

// =========================================================
// PASO 4: LÓGICA DE JUEGO (CARTAS)
// =========================================================
function voltearCarta() {
    // Si la carta ya está volteada (flipped), no hacer nada al darle clic
    if (lockBoard || this === firstCard || this.classList.contains('flipped')) return;
    
    playSound('click');
    this.classList.add('flipped');
    
    if (!firstCard) { 
        firstCard = this; 
        return; 
    }
    
    secondCard = this; 
    verificarPareja();
}

function verificarPareja() {
    if (firstCard.dataset.name === secondCard.dataset.name) {
        playSound('match');
        players[currentPlayer].score++; 
        pairsFound++;
        
        deshabilitarCartas(); 
        actualizarMarcador();
        
        if(pairsFound === activePairsCount) setTimeout(mostrarVictoria, 1000);
    } else {
        playSound('error'); 
        desvoltearCartas();
        currentPlayer = (currentPlayer + 1) % players.length;
        setTimeout(actualizarMarcador, 1000);
    }
}

function deshabilitarCartas() {
    firstCard.removeEventListener('click', voltearCarta);
    secondCard.removeEventListener('click', voltearCarta);
    resetearTablero();
}

function desvoltearCartas() {
    lockBoard = true;
    setTimeout(() => {
        firstCard.classList.remove('flipped'); 
        secondCard.classList.remove('flipped');
        resetearTablero();
    }, 1000);
}

function resetearTablero() { 
    [firstCard, secondCard, lockBoard] = [null, null, false]; 
}

// =========================================================
// PASO 5: MARCADOR Y FIN DE JUEGO
// =========================================================
function actualizarMarcador() {
    document.getElementById('turn-indicator').textContent = `Turno de: ${players[currentPlayer].nombre}`;
    document.getElementById('score-board').innerHTML = players.map(p => `<strong>${p.nombre}</strong>: ${p.score} pts`).join(' &nbsp;|&nbsp; ');
}

function mostrarVictoria() {
    audios.bg.pause(); 
    playSound('win');
    
    document.getElementById('game-screen').classList.replace('active', 'hidden');
    document.getElementById('victory-screen').classList.replace('hidden', 'active');

    let maxScore = Math.max(...players.map(p => p.score));
    let ganadores = players.filter(p => p.score === maxScore);
    
    document.getElementById('winner-text').innerHTML = ganadores.length > 1 
        ? `¡Empate espectacular entre <strong>${ganadores.map(g=>g.nombre).join(' y ')}</strong> con ${maxScore} puntos!`
        : `¡Felicidades <strong>${ganadores[0].nombre}</strong>! Has ganado con ${maxScore} puntos.`;
}

function reiniciarJuego() {
    playSound('click');
    document.getElementById('victory-screen').classList.replace('active', 'hidden');
    document.getElementById('lobby-screen').classList.replace('hidden', 'active');
}