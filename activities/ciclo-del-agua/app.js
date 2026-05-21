(() => {
  'use strict';

  const stages = [
    {
      id: 1,
      title: 'Evaporación',
      glyph: '☀',
      desc:
        'El Sol calienta el agua de océanos, ríos y lagos. El calor convierte el agua líquida en vapor invisible, que sube por el aire hacia el cielo.',
      key: 'el calor transforma el agua líquida en vapor.',
    },
    {
      id: 2,
      title: 'Condensación',
      glyph: '☁',
      desc:
        'Arriba, el aire es más frío. El vapor pierde calor y se transforma en gotitas muy pequeñas que se juntan unas con otras formando las nubes.',
      key: 'al enfriarse, el vapor vuelve a estado líquido.',
    },
    {
      id: 3,
      title: 'Precipitación',
      glyph: '☂',
      desc:
        'Cuando las gotitas dentro de la nube se vuelven pesadas, caen sobre la tierra como lluvia. Si el aire está muy frío, caen como nieve o granizo.',
      key: 'el agua de las nubes regresa a la superficie.',
    },
    {
      id: 4,
      title: 'Colección',
      glyph: '∿',
      desc:
        'El agua que cae llena ríos, lagos y océanos. Otra parte se filtra entre la tierra y forma los mantos acuíferos. Y el Sol vuelve a calentarla — el ciclo comienza otra vez.',
      key: 'el agua regresa a su origen y todo recomienza.',
    },
  ];

  const scene = document.querySelector('.scene');
  const info = document.querySelector('.info');
  const indicator = document.querySelector('.stage-indicator');
  const btnPrev = document.querySelector('.btn-prev');
  const btnNext = document.querySelector('.btn-next');

  const bind = {
    num: document.querySelector('[data-bind="num"]'),
    title: document.querySelector('[data-bind="title"]'),
    desc: document.querySelector('[data-bind="desc"]'),
    key: document.querySelector('[data-bind="key"]'),
    glyph: document.querySelector('[data-bind="glyph"]'),
  };

  let current = 1;
  let switchTimer = null;

  function render(stageId, { fromUser = true } = {}) {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) return;
    current = stageId;

    // Animar transición del panel
    if (fromUser) {
      info.classList.remove('is-switching');
      // forzar reflow para reiniciar la animación
      // eslint-disable-next-line no-unused-expressions
      void info.offsetWidth;
      info.classList.add('is-switching');
      clearTimeout(switchTimer);
      switchTimer = setTimeout(() => info.classList.remove('is-switching'), 600);
    }

    // Escena
    scene.dataset.stage = String(stage.id);

    // Indicador
    Array.from(indicator.children).forEach((li) => {
      li.classList.toggle('active', Number(li.dataset.stage) === stage.id);
    });

    // Texto
    bind.num.textContent = String(stage.id).padStart(2, '0');
    bind.title.textContent = stage.title;
    bind.desc.textContent = stage.desc;
    bind.glyph.textContent = stage.glyph;
    bind.key.innerHTML = `<span>Concepto clave:</span> ${stage.key}`;

    // Botones — etiqueta del "Siguiente" cambia en la última etapa
    const nextLabel = btnNext.querySelector('.btn-label');
    if (stage.id === stages.length) {
      nextLabel.textContent = 'Reiniciar';
    } else {
      nextLabel.textContent = 'Siguiente';
    }
  }

  function next() {
    const nextId = current === stages.length ? 1 : current + 1;
    render(nextId);
  }

  function prev() {
    const prevId = current === 1 ? stages.length : current - 1;
    render(prevId);
  }

  // ─── Eventos ────────────────────────────────────────────
  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);

  Array.from(indicator.children).forEach((li) => {
    li.addEventListener('click', () => {
      const id = Number(li.dataset.stage);
      if (id && id !== current) render(id);
    });
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = Number(li.dataset.stage);
        if (id && id !== current) render(id);
      }
    });
  });

  // Teclado global
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      prev();
    } else if (e.key === 'Home') {
      e.preventDefault();
      render(1);
    } else if (e.key === 'End') {
      e.preventDefault();
      render(stages.length);
    }
  });

  // Estado inicial
  render(1, { fromUser: false });
})();
