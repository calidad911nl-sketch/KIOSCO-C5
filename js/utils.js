// =========================================================
// utils.js — Ajustes compartidos para iPad y pantallas táctiles
// Se incluye en TODAS las páginas del kiosco (index, memorama,
// despachador, coloreando) antes de su script propio.
// =========================================================
(function () {
  "use strict";

  /* -----------------------------------------------------------
     1) Corrige el problema de "100vh" en Safari de iPad/iOS.
     En iOS, 100vh no coincide con el alto real visible cuando
     la barra de direcciones aparece/desaparece, lo que puede
     recortar el kiosco. Guardamos el alto real en la variable
     CSS --vh y la usamos así: height: calc(var(--vh, 1vh) * 100)
  ----------------------------------------------------------- */
  function setVH() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  }
  setVH();

  var vhResizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(vhResizeTimer);
    vhResizeTimer = setTimeout(setVH, 150);
  });
  window.addEventListener('orientationchange', function () {
    setTimeout(setVH, 300);
  });

  /* -----------------------------------------------------------
     2) Desbloquea todos los <audio> de la página en el primer
     toque/clic. En iOS/Safari, cada elemento <audio> debe
     reproducirse una vez dentro de un gesto directo del usuario
     antes de poder reproducirse por código (por ejemplo, un
     sonido de victoria disparado dentro de un setTimeout).
     Si el audio YA se está reproduciendo intencionalmente
     (por ejemplo música de fondo que otra pantalla acaba de
     iniciar en este mismo toque), no lo tocamos para no
     interrumpirlo.
  ----------------------------------------------------------- */
  var audioUnlocked = false;
  function unlockAllAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    var audios = document.querySelectorAll('audio');
    audios.forEach(function (a) {
      if (!a.paused) return; // ya suena intencionalmente, no lo interrumpimos
      var wasMuted = a.muted;
      a.muted = true;
      var p = a.play();
      if (p && typeof p.then === 'function') {
        p.then(function () {
          a.pause();
          a.currentTime = 0;
          a.muted = wasMuted;
        }).catch(function () {
          a.muted = wasMuted;
        });
      } else {
        a.pause();
        a.currentTime = 0;
        a.muted = wasMuted;
      }
    });
  }
  document.addEventListener('touchstart', unlockAllAudio, { once: true, passive: true });
  document.addEventListener('click', unlockAllAudio, { once: true });

})();
