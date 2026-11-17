'use strict';
(() => {
  const grid = document.getElementById('pet-grid');
  const status = document.getElementById('library-status');
  const addButton = document.getElementById('add-pet');
  const search = document.getElementById('pet-search');
  const count = document.getElementById('library-count');
  const empty = document.getElementById('library-empty');
  let activePetId;
  const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');

  function filterPets() {
    const query = normalize(search.value.trim());
    let matches = 0;
    for (const card of grid.children) {
      card.hidden = !card.dataset.searchName.includes(query);
      if (!card.hidden) matches++;
    }
    count.textContent = matches + (matches === 1 ? ' mascota' : ' mascotas');
    empty.hidden = !query || matches > 0;
  }
  search.addEventListener('input', filterPets);

  async function backToScene() {
    sessionStorage.setItem('focus-layer-on-return', 'true');
    await window.aula.openPanel();
  }
  let busy = false;
  let fetchingFrames = false;
  async function animatePreviews() {
    if (fetchingFrames || !grid.children.length) return;
    fetchingFrames = true;
    try {
      const response = await fetch('/library-frames');
      if (!response.ok) return;
      const frames = await response.json();
      grid.querySelectorAll('.pet-choice:not([hidden])').forEach(card => {
        const frame = frames[card.dataset.petId];
        if (frame) card.querySelector('iframe').contentWindow.postMessage({ type: 'aula:library-frame', frame }, location.origin);
      });
    } catch { /* El siguiente fotograma reintenta la conexión local. */ }
    finally { fetchingFrames = false; }
  }
  const animationTimer = setInterval(animatePreviews, 50);
  window.addEventListener('pagehide', () => clearInterval(animationTimer));
  function markSelected(id) {
    activePetId = id;
    grid.querySelectorAll('.pet-choice').forEach(card => {
      const selected = card.dataset.petId === id;
      card.classList.toggle('selected', selected);
      card.querySelector('.selected-label').hidden = !selected;
      const button = card.querySelector('button');
      button.disabled = busy || selected;
      button.textContent = selected ? 'Actual' : 'Elegir';
    });
  }
  async function load() {
    const library = await window.aula.getPetLibrary();
    const isVoice = library.activeType === 'voice';
    addButton.title = isVoice ? 'Importar un archivo .pet' : 'Importar un archivo .aulapet o una imagen';
    document.getElementById('selector-type').textContent = isVoice ? '.pet' : '.aulapet';
    document.getElementById('selector-title').textContent = isVoice ? 'Mascotas de voz' : 'Mascotas de recorrido';
    document.getElementById('selector-description').textContent = isVoice ? 'Elige el personaje que hablará con tu micrófono.' : 'Elige el personaje que recorrerá la escena.';
    const byName = new Intl.Collator('es', { numeric: true });
    const pets = [...library.pets].sort((a, b) => Number(b.id === library.activePetId) - Number(a.id === library.activePetId) || byName.compare(a.name, b.name));
    const cards = pets.map(pet => {
      const card = document.createElement('article');
      card.className = 'pet-choice';
      card.dataset.petId = pet.id;
      card.dataset.searchName = normalize(pet.name);
      const preview = document.createElement('div'); preview.className = 'pet-preview';
      const selected = document.createElement('span'); selected.className = 'selected-label'; selected.textContent = 'Selección actual';
      const animation = document.createElement('iframe'); animation.src = `/overlay?surface=library&pet=${encodeURIComponent(pet.id)}`;
      animation.title = `Animación de ${pet.name}`; animation.tabIndex = -1;
      preview.append(selected, animation);
      const footer = document.createElement('div'); footer.className = 'pet-choice-footer';
      const name = document.createElement('h2'); name.textContent = pet.name;
      const button = document.createElement('button'); button.className = 'secondary-button'; button.setAttribute('aria-label', `Elegir ${pet.name}`);
      button.type = 'button';
      button.addEventListener('click', async () => {
        if (busy) return;
        busy = true; addButton.disabled = true; markSelected(library.activePetId);
        try {
          const result = await window.aula.selectPet(pet.id);
          if (result.error) throw new Error(result.error);
          await backToScene();
        } catch (error) {
          status.hidden = false; status.textContent = error.message || 'No se pudo elegir esta mascota.';
          busy = false; addButton.disabled = false; markSelected(activePetId);
        }
      });
      footer.append(name, button); card.append(preview, footer); return card;
    });
    grid.replaceChildren(...cards);
    markSelected(library.activePetId);
    search.disabled = !cards.length;
    addButton.disabled = busy;
    filterPets();
    status.hidden = cards.length > 0 && !library.unavailable;
    status.textContent = library.unavailable ? 'Algunos archivos no se pudieron leer. Las mascotas disponibles aparecen aquí.' : 'Todavía no hay mascotas. Añade una para comenzar.';
    document.documentElement.dataset.libraryReady = 'true';
  }
  document.getElementById('back-panel').addEventListener('click', () => backToScene().catch(() => {
    status.hidden = false;
    status.textContent = 'No se pudo volver a la escena. Inténtalo de nuevo.';
  }));
  addButton.addEventListener('click', async () => {
    if (busy) return;
    busy = true; addButton.disabled = true;
    try {
      const result = await window.aula.importImage();
      if (result.error) throw new Error(result.error);
      if (result.state) {
        search.value = '';
        await load();
      }
    } catch (error) { status.hidden = false; status.textContent = error.message || 'No se pudo añadir la mascota.'; }
    finally { busy = false; addButton.disabled = false; markSelected(activePetId); }
  });
  window.aula.onState(state => markSelected(state.activePetId));
  load().catch(() => { status.textContent = 'No se pudieron cargar las mascotas. Vuelve y abre el selector de nuevo.'; });
})();
