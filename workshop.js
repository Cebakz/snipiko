const size = 6;

function coordinate(label) {
  return [Number(label[1]) - 1, label.charCodeAt(0) - 65];
}

/** A single move on a fixed teaching board. No generation, score or saved state. */
export function compareMove(board, start, end) {
  const [sr, sc] = coordinate(start);
  const [er, ec] = coordinate(end);
  const selected = [];
  for (let r = Math.min(sr, er); r <= Math.max(sr, er); r++) {
    for (let c = Math.min(sc, ec); c <= Math.max(sc, ec); c++) selected.push(r * size + c);
  }
  const clues = selected.map(i => board[i]).filter(value => /[1-6]/.test(value));
  const legal = selected.every(i => board[i] !== '#') && clues.length === 1 && Number(clues[0]) === selected.length;
  if (!legal) return { legal, selected, cleared: [], lines: 0, after: board };

  const filled = [...board];
  for (const i of selected) filled[i] = '#';
  const cleared = new Set();
  let lines = 0;
  for (let i = 0; i < size; i++) {
    const row = Array.from({ length: size }, (_, c) => i * size + c);
    const column = Array.from({ length: size }, (_, r) => r * size + i);
    for (const line of [row, column]) {
      if (line.every(i => filled[i] === '#')) {
        lines++;
        for (const i of line) cleared.add(i);
      }
    }
  }
  for (const i of cleared) filled[i] = '.';
  return { legal, selected, cleared: [...cleared], lines, after: filled.join('') };
}

export function enhanceWorkshop(doc) {
  for (const lesson of doc.querySelectorAll('[data-lesson]')) {
    const form = lesson.querySelector('.lab-form');
    const diagram = lesson.querySelector('.lab-board');
    const squares = [...diagram.querySelectorAll('[data-cell]')];
    const answers = [...lesson.querySelectorAll('.lab-answers li span')];
    const status = lesson.querySelector('.lab-result');
    const original = diagram.dataset.board;

    function draw(board, selected = [], cleared = [], valid = true) {
      squares.forEach((cell, i) => {
        const value = board[i];
        cell.textContent = /[1-6]/.test(value) ? value : '';
        cell.classList.toggle('block', value === '#');
        cell.classList.toggle('clue', value !== '#' && value !== '.');
        cell.classList.toggle('chosen', selected.includes(i));
        cell.classList.toggle('rejected', !valid && selected.includes(i));
        cell.classList.toggle('cleared', cleared.includes(i));
      });
    }

    form.addEventListener('submit', event => {
      event.preventDefault();
      const choice = form.querySelector('input:checked');
      if (!choice) {
        status.textContent = 'Choose a rectangle first.';
        return;
      }
      const result = compareMove(original, choice.dataset.start, choice.dataset.end);
      draw(result.after, result.selected, result.cleared, result.legal);
      status.textContent = `${choice.dataset.start}–${choice.dataset.end}. ${answers[Number(choice.value)].textContent}`;
    });
    form.addEventListener('change', () => {
      draw(original);
      status.textContent = '';
    });
    form.addEventListener('reset', () => {
      draw(original);
      status.textContent = 'Starting board restored.';
    });
    form.hidden = false;
  }
}

if (typeof document !== 'undefined') enhanceWorkshop(document);
