'use strict';
(() => {
  const grid = document.getElementById('pet-grid');
  const status = document.getElementById('library-status');
  const addButton = document.getElementById('add-pet');
  let busy = false;
  let fetchingFrames = false;
  async function animatePreviews() {
    if (fetchingFrames || !grid.children.length) return;
    fetchingFrames = true;
    try {
      const response = await fetch('/library-frames');
      if (!response.ok) return;
      const frames = await response.json();
      grid.querySelectorAll('.pet-choice').forEach(card => {
        const frame = frames[card.dataset.petId];
        if (frame) card.querySelector('iframe').contentWindow.postMessage({ type: 'aula:library-frame', frame }, location.origin);
      });
    } catch { /* El siguiente fotograma reintenta la conexión local. */ }
    finally { fetchingFrames = false; }
  }
  const animationTimer = setInterval(animatePreviews, 50);
  window.addEventListener('pagehide', () => clearInterval(animationTimer));
  function markSelected(id) {
    grid.querySelectorAll('.pet-choice').forEach(card => {
      const selected = card.dataset.petId === id;
      card.classList.toggle('selected', selected);
      card.querySelector('.selected-label').hidden = !selected;
      const button = card.querySelector('button');
      button.disabled = busy || selected;
      button.textContent = selected ? 'Seleccionada' : 'Elegir mascota';
    });
  }
  async function load() {
    const library = await window.aula.getPetLibrary();
    const isVoice = library.activeType === 'voice';
    document.getElementById('selector-type').textContent = isVoice ? 'MASCOTAS .PET' : 'MASCOTAS .AULAPET';
    document.getElementById('selector-title').textContent = isVoice ? 'Tu voz, en una esquina.' : 'Un compañero en movimiento.';
    document.getElementById('selector-description').textContent = isVoice ? 'Elige quién habla y parpadea. La mascota de recorrido seguirá acompañándote.' : 'Elige quién recorre la pantalla y saluda. La mascota de voz conserva su lugar.';
    const cards = library.pets.map(pet => {
      const card = document.createElement('article');
      card.className = 'pet-choice'; card.dataset.petId = pet.id;
      const preview = document.createElement('div'); preview.className = 'pet-preview';
      const selected = document.createElement('span'); selected.className = 'selected-label'; selected.textContent = 'Tu mascota actual';
      const animation = document.createElement('iframe'); animation.src = `/overlay?surface=library&pet=${encodeURIComponent(pet.id)}`;
      animation.title = `Animación de ${pet.name}`; animation.tabIndex = -1;
      preview.append(selected, animation);
      const footer = document.createElement('div'); footer.className = 'pet-choice-footer';
      const name = document.createElement('h2'); name.textContent = pet.name;
      if (pet.kind === 'voice') { const label = document.createElement('small'); label.textContent = 'Voz + parpadeo · demostración automática'; footer.append(label); }
      const button = document.createElement('button'); button.className = 'secondary-button'; button.setAttribute('aria-label', `Elegir ${pet.name}`);
      button.addEventListener('click', async () => {
        if (busy) return;
        busy = true; addButton.disabled = true; markSelected(library.activePetId);
        try {
          const result = await window.aula.selectPet(pet.id);
          if (result.error) throw new Error(result.error);
          window.aula.openPanel();
        } catch (error) {
          status.hidden = false; status.textContent = error.message || 'No se pudo elegir esta mascota.';
          busy = false; addButton.disabled = false; markSelected(library.activePetId);
        }
      });
      footer.append(name, button); card.append(preview, footer); return card;
    });
    grid.replaceChildren(...cards); markSelected(library.activePetId);
    status.hidden = cards.length > 0 && !library.unavailable;
    status.textContent = library.unavailable ? 'Algunos archivos no se pudieron leer. Las mascotas disponibles aparecen aquí.' : 'Todavía no hay mascotas. Añade una para comenzar.';
    document.documentElement.dataset.libraryReady = 'true';
  }
  document.getElementById('back-panel').addEventListener('click', () => window.aula.openPanel());
  addButton.addEventListener('click', async () => {
    if (busy) return;
    busy = true; addButton.disabled = true;
    try {
      const result = await window.aula.importImage();
      if (result.error) throw new Error(result.error);
      if (result.state) await load();
    } catch (error) { status.hidden = false; status.textContent = error.message || 'No se pudo añadir la mascota.'; }
    finally { busy = false; addButton.disabled = false; const state = await window.aula.getState(); markSelected(state.activePetId); }
  });
  window.aula.onState(state => markSelected(state.activePetId));
  load().catch(() => { status.textContent = 'No se pudieron cargar las mascotas. Vuelve y abre el selector de nuevo.'; });
})();
