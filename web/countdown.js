'use strict';
(() => {
  function formatTime(seconds) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
  function parseTime(text) {
    const value = text.trim();
    if (/^\d+$/.test(value)) return Number(value);
    const match = /^(\d{1,2}):([0-5]\d)$/.exec(value);
    return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
  }
  if (typeof module !== 'undefined') { module.exports = { formatTime, parseTime }; return; }
  window.AulaTime = { formatTime, parseTime };
  window.AulaCountdown = class {
    constructor(container, sound, surface = 'obs') {
      this.element = document.createElement('div');
      this.element.id = 'class-countdown';
      this.element.hidden = true;
      this.element.innerHTML = '<div class="timer-caption"></div><div class="timer-digits"></div><div class="timer-detail"></div>';
      container.append(this.element);
      this.sound = sound;
      this.surface = surface;
      this.textKey = '';
      this.lastBell = surface === 'tablet' ? sessionStorage.getItem('aula:tablet-bell') : null;
      this.audio = sound ? new Audio('/boxing-bell.wav') : null;
      if (this.audio) { this.audio.preload = 'auto'; this.audio.volume = .75; }
    }
    render(timer, canvas, width, height, connected) {
      const element = this.element;
      element.hidden = !connected || !timer?.visible || (this.surface === 'desktop' && !timer.desktopEnabled);
      if (!timer) return;
      const scale = Math.min(width / canvas.width, height / canvas.height);
      element.style.left = `${timer.x * scale}px`;
      element.style.bottom = `${timer.y * scale}px`;
      element.style.transform = `scale(${scale})`;
      if (element.dataset.phase !== timer.phase) element.dataset.phase = timer.phase;
      element.dataset.remaining = String(timer.remaining);
      const textKey = `${timer.phase}:${timer.remaining}:${timer.ready}:${timer.seconds}`;
      if (this.textKey !== textKey) {
        this.textKey = textKey;
        element.querySelector('.timer-caption').textContent = ({ ready: 'PREPÁRENSE', running: timer.remaining > 3 ? '¡COMENZAMOS!' : '', finished: '¡TIEMPO TERMINADO!', position: 'POSICIÓN DEL TEMPORIZADOR' })[timer.phase] || '';
        element.querySelector('.timer-digits').textContent = timer.phase === 'ready' ? String(timer.ready) : timer.phase === 'finished' ? '✓' : formatTime(timer.remaining);
        element.querySelector('.timer-detail').textContent = timer.phase === 'finished' ? 'Actividad finalizada.' : timer.phase === 'ready' ? `Tendrán ${formatTime(timer.seconds)}` : timer.phase === 'position' ? 'X → derecha · Y ↑ arriba' : '';
      }
      if (this.audio && connected && timer.bell && this.lastBell !== timer.runId) {
        this.lastBell = timer.runId;
        if (this.surface === 'tablet') sessionStorage.setItem('aula:tablet-bell', this.lastBell);
        this.audio.currentTime = 0;
        this.audio.play().then(() => { element.dataset.audio = 'played'; element.dataset.bellCount = String(Number(element.dataset.bellCount || 0) + 1); }).catch(() => { element.dataset.audio = 'blocked'; });
      }
      if (this.audio && !timer.active && !this.audio.paused) { this.audio.pause(); this.audio.currentTime = 0; }
    }
    disconnect() { this.element.hidden = true; this.audio?.pause(); }
  };
})();
