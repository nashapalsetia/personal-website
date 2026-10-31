/* ============================================================
   Interactive pieces used across the site.
   Each widget mounts into an element with a matching
   data-play attribute, e.g. <div data-play="sketch"></div>
   ============================================================ */

(function () {
  'use strict';

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- Soccer: penalty kick ---------- */
  function penalty(root) {
    const zoneNames = [
      ['Top left', 'Top centre', 'Top right'],
      ['Bottom left', 'Bottom centre', 'Bottom right'],
    ];

    root.innerHTML = `
      <p class="play-title">Take a penalty</p>
      <p class="play-hint">Pick a spot in the goal. The corners are harder to save, but aim too high and you might miss the frame.</p>
      <div class="pk-field">
        <div class="pk-goal">
          <svg class="pk-keeper" viewBox="0 0 60 100" aria-hidden="true">
            <g stroke="#2b2b2b" stroke-width="7" stroke-linecap="round">
              <line x1="20" y1="30" x2="5" y2="8" />
              <line x1="40" y1="30" x2="55" y2="8" />
              <line x1="25" y1="60" x2="21" y2="95" />
              <line x1="35" y1="60" x2="39" y2="95" />
            </g>
            <circle cx="5" cy="8" r="5" fill="#b8995a" />
            <circle cx="55" cy="8" r="5" fill="#b8995a" />
            <rect x="17" y="22" width="26" height="42" rx="7" fill="#6b6048" />
            <circle cx="30" cy="12" r="9" fill="#2b2b2b" />
          </svg>
          <div class="pk-zones"></div>
        </div>
        <div class="pk-ball" aria-hidden="true"></div>
        <p class="pk-msg" aria-live="polite"></p>
      </div>
      <div class="play-bar">
        <span class="play-score">Goals <b data-goals>0</b> / Shots <b data-shots>0</b></span>
        <button type="button" class="btn btn-quiet" data-reset>Reset</button>
      </div>`;

    const zones = root.querySelector('.pk-zones');
    const keeper = root.querySelector('.pk-keeper');
    const ball = root.querySelector('.pk-ball');
    const msg = root.querySelector('.pk-msg');
    const goalsEl = root.querySelector('[data-goals]');
    const shotsEl = root.querySelector('[data-shots]');
    let goals = 0, shots = 0, busy = false;

    zoneNames.forEach((row, r) => row.forEach((name, c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pk-zone';
      b.setAttribute('aria-label', 'Shoot ' + name.toLowerCase());
      b.addEventListener('click', () => shoot(r, c, name));
      zones.appendChild(b);
    }));

    function placeKeeper(r, c) {
      // Standing in the middle, or diving toward (r, c)
      const left = [20, 50, 80][c];
      const bottom = r === 0 ? 20 : 0;
      const tilt = c === 1 ? 0 : (c === 0 ? -1 : 1) * (r === 0 ? 65 : 85);
      keeper.style.left = left + '%';
      keeper.style.bottom = bottom + '%';
      keeper.style.transform = `translateX(-50%) rotate(${tilt}deg)`;
    }

    function resetPositions() {
      keeper.style.left = keeper.style.bottom = keeper.style.transform = '';
      ball.style.left = ball.style.top = ball.style.transform = '';
      msg.textContent = '';
      msg.className = 'pk-msg';
    }

    async function shoot(r, c, name) {
      if (busy) return;
      busy = true;
      root.classList.add('is-busy');

      const kr = Math.random() < 0.5 ? 0 : 1;
      const kc = Math.floor(Math.random() * 3);
      const missed = r === 0 && c !== 1 && Math.random() < 0.15;
      // The keeper covers the middle whether they jump or stay down
      const saved = !missed && kc === c && (kr === r || c === 1);

      // Ball travels from the spot into the goal (field coordinates, %)
      const x = 10 + 80 * [1 / 6, 3 / 6, 5 / 6][c];
      const y = missed ? 2 : 8 + 55 * [0.28, 0.72][r];
      ball.style.left = (missed ? x + (c === 0 ? -6 : 6) : x) + '%';
      ball.style.top = y + '%';
      ball.style.transform = 'translate(-50%, -50%) scale(0.7)';
      placeKeeper(kr, kc);

      await wait(500);
      shots++;
      if (saved) {
        msg.textContent = 'Saved!';
        msg.classList.add('is-miss');
      } else if (missed) {
        msg.textContent = Math.random() < 0.5 ? 'Off the post!' : 'Over the bar!';
        msg.classList.add('is-miss');
      } else {
        goals++;
        msg.textContent = 'GOAL! ' + name + '.';
        msg.classList.add('is-goal');
      }
      goalsEl.textContent = goals;
      shotsEl.textContent = shots;

      await wait(1400);
      resetPositions();
      busy = false;
      root.classList.remove('is-busy');
    }

    root.querySelector('[data-reset]').addEventListener('click', () => {
      goals = shots = 0;
      goalsEl.textContent = shotsEl.textContent = '0';
    });
  }

  /* ---------- Health: breathing pacer ---------- */
  function breathe(root) {
    const patterns = {
      box: [['Breathe in', 4, 'in'], ['Hold', 4], ['Breathe out', 4, 'out'], ['Hold', 4]],
      relax: [['Breathe in', 4, 'in'], ['Hold', 7], ['Breathe out', 8, 'out']],
      even: [['Breathe in', 5, 'in'], ['Breathe out', 5, 'out']],
    };

    root.innerHTML = `
      <p class="play-title">Take a breather</p>
      <p class="play-hint">Follow the circle for a minute. Slow breathing like this is a simple way to calm your heart rate before a game, a performance, or an exam.</p>
      <div class="br-stage">
        <div class="br-circle"></div>
        <div class="br-text" aria-live="polite">
          <span class="br-label">Ready</span>
          <span class="br-num"></span>
        </div>
      </div>
      <div class="play-bar">
        <select data-pattern aria-label="Breathing pattern">
          <option value="box">Box · 4-4-4-4</option>
          <option value="relax">Relax · 4-7-8</option>
          <option value="even">Even · 5-5</option>
        </select>
        <span class="play-score">Breaths <b data-cycles>0</b></span>
        <button type="button" class="btn" data-toggle>Start</button>
      </div>`;

    const circle = root.querySelector('.br-circle');
    const label = root.querySelector('.br-label');
    const num = root.querySelector('.br-num');
    const select = root.querySelector('[data-pattern]');
    const toggle = root.querySelector('[data-toggle]');
    const cyclesEl = root.querySelector('[data-cycles]');
    let timer = null, cycles = 0;

    function runStep(steps, i) {
      const [text, secs, kind] = steps[i];
      let left = secs;
      label.textContent = text;
      num.textContent = left;
      if (kind) {
        circle.style.transitionDuration = secs + 's';
        circle.classList.toggle('is-full', kind === 'in');
      }
      timer = setInterval(() => {
        if (--left > 0) return void (num.textContent = left);
        clearInterval(timer);
        const next = (i + 1) % steps.length;
        if (next === 0) cyclesEl.textContent = ++cycles;
        runStep(steps, next);
      }, 1000);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
      circle.style.transitionDuration = '0.8s';
      circle.classList.remove('is-full');
      label.textContent = 'Ready';
      num.textContent = '';
      toggle.textContent = 'Start';
    }

    toggle.addEventListener('click', () => {
      if (timer) return stop();
      cycles = 0;
      cyclesEl.textContent = '0';
      toggle.textContent = 'Stop';
      runStep(patterns[select.value], 0);
    });
    select.addEventListener('change', () => { if (timer) stop(); });
  }

  /* ---------- Sketching: sketchpad ---------- */
  function sketch(root) {
    const PAPER = '#fffdf8';
    const colors = [
      ['Graphite', '#3a3a3a'], ['Ink', '#1d2a44'], ['Gold', '#b8995a'],
      ['Rust', '#a4553a'], ['Sage', '#6f8a68'], ['Sky', '#5b7fa6'],
    ];
    const sizes = [['Fine', 3], ['Medium', 7], ['Bold', 18]];

    root.innerHTML = `
      <p class="play-title">Sketchpad</p>
      <p class="play-hint">Draw something with a mouse, finger, or stylus (pen pressure works too). Save it if it turns out well.</p>
      <div class="sk-tools">
        <div class="sk-group">
          <span class="sk-label">Color</span>
          ${colors.map(([n, c], i) => `<button type="button" class="sk-swatch" style="--c:${c}" title="${n}" aria-label="${n}" aria-pressed="${i === 0}" data-color="${c}"></button>`).join('')}
          <button type="button" class="sk-chip sk-eraser" aria-pressed="false" data-color="${PAPER}">Eraser</button>
        </div>
        <div class="sk-group">
          <span class="sk-label">Size</span>
          ${sizes.map(([n, s], i) => `<button type="button" class="sk-chip sk-size" title="${n}" aria-label="${n} brush" aria-pressed="${i === 1}" data-size="${s}"><span class="sk-dot" style="--s:${Math.max(3, Math.round(s * 0.65))}px"></span></button>`).join('')}
        </div>
        <div class="sk-group sk-actions">
          <button type="button" class="btn btn-quiet" data-undo>Undo</button>
          <button type="button" class="btn btn-quiet" data-clear>Clear</button>
          <button type="button" class="btn" data-save>Save</button>
        </div>
      </div>
      <canvas class="sk-canvas" width="1200" height="540" aria-label="Drawing canvas"></canvas>`;

    const canvas = root.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const history = [];
    let color = colors[0][1], size = sizes[1][1];
    let drawing = false, last = null, lastMid = null;

    // Size buttons preview the brush in the current color
    root.style.setProperty('--pen', color);
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    function pick(group, btn) {
      root.querySelectorAll(group).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    }
    root.querySelectorAll('[data-color]').forEach((b) => b.addEventListener('click', () => {
      color = b.dataset.color;
      pick('[data-color]', b);
      root.style.setProperty('--pen', color);
      root.classList.toggle('is-erasing', color === PAPER);
    }));
    root.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
      size = Number(b.dataset.size);
      pick('[data-size]', b);
    }));

    function snapshot() {
      history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (history.length > 10) history.shift();
    }

    function point(e) {
      const r = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * (canvas.width / r.width),
        y: (e.clientY - r.top) * (canvas.height / r.height),
        p: e.pointerType === 'pen' ? e.pressure || 0.5 : 0.5,
      };
    }

    const width = (pt) => size * (0.3 + pt.p * 1.4) * (color === PAPER ? 2.5 : 1);

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      snapshot();
      drawing = true;
      last = lastMid = point(e);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(last.x, last.y, width(last) / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const pt = point(e);
      const mid = { x: (last.x + pt.x) / 2, y: (last.y + pt.y) / 2 };
      ctx.strokeStyle = color;
      ctx.lineWidth = width(pt);
      ctx.beginPath();
      ctx.moveTo(lastMid.x, lastMid.y);
      ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y);
      ctx.stroke();
      last = pt;
      lastMid = mid;
    });

    ['pointerup', 'pointercancel'].forEach((t) => canvas.addEventListener(t, () => (drawing = false)));

    root.querySelector('[data-undo]').addEventListener('click', () => {
      if (history.length) ctx.putImageData(history.pop(), 0, 0);
    });
    root.querySelector('[data-clear]').addEventListener('click', () => {
      snapshot();
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
    root.querySelector('[data-save]').addEventListener('click', () => {
      canvas.toBlob((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'sketch.png';
        a.click();
        URL.revokeObjectURL(a.href);
      });
    });
  }

  /* ---------- Mount ---------- */
  const widgets = { penalty, breathe, sketch };

  document.querySelectorAll('[data-play]').forEach((root) => {
    const init = widgets[root.dataset.play];
    if (!init) return;
    root.classList.add('play');
    init(root);
  });
})();
