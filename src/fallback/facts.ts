/**
 * fallback/facts — `.sem-facts` flashcard + quiz interactivity, no Lit.
 *
 * Extracted verbatim from the inline IIFE that used to live in
 * demo/index.html (D5: the same logic had drifted into a second hand-written
 * copy inside the Lit elements). Behavior is a tested contract — DOM shape,
 * class names, `data-sem-fallback`, and meter text are all asserted by
 * cypress/e2e/npl-facts.cy.js and must not change.
 *
 * The one deliberate divergence from the original inline source: option order
 * comes from a seeded Fisher-Yates draw (shared/rng) rather than
 * `sort(() => Math.random() - .5)`. That comparator was inconsistent, so its
 * output was neither uniform nor stable across JS engines. Sharing the draw
 * with src/elements/npl-facts.ts is what makes the two tiers emit identical
 * option order for a fixed `data-sem-seed`.
 */

import { randomFor, shuffle } from '../shared/rng.js';

export function enhanceFacts(scope: ParentNode): void {
  scope.querySelectorAll<HTMLElement>('.sem-facts').forEach((root) => {
    const view = root.getAttribute('data-view-as') || 'list';
    const items = Array.from(root.querySelectorAll<HTMLElement>('.sem-fact'));
    if (view === 'list' || items.length === 0) return;
    root.setAttribute('data-sem-fallback', '');

    const rand = randomFor(root);

    const chrome = document.createElement('div');
    chrome.className = 'sem-facts-chrome';
    chrome.innerHTML =
      '<button type="button" data-act="prev" aria-label="previous">←</button>' +
      '<span class="sem-facts-meter"></span>' +
      '<button type="button" data-act="next" aria-label="next">→</button>';
    root.insertBefore(chrome, root.firstChild);

    let i = 0;
    const score = { correct: 0, answered: 0 };
    const progress = chrome.querySelector('.sem-facts-meter') as HTMLElement;

    function optionsFor(item: Element): { text: string; correct: boolean }[] {
      const correct = item.querySelector('.sem-conclusion');
      const distractors = Array.from(item.querySelectorAll('.sem-distractor'));
      const others = items
        .filter((f) => f !== item)
        .map((f) => f.querySelector('.sem-conclusion'))
        .filter(Boolean) as Element[];
      const pool = distractors.concat(others).slice(0, 3);
      const opts = shuffle(pool.concat([correct as Element]), rand);
      return opts.map((el) => ({
        text: (el.textContent || '').trim(),
        correct: el === correct,
      }));
    }

    function renderQuiz(item: Element): void {
      let box = item.querySelector('.sem-quiz-options') as HTMLElement | null;
      if (!box) {
        box = document.createElement('div');
        box.className = 'sem-quiz-options';
        item.appendChild(box);
      }
      const target = box;
      target.innerHTML = '';
      optionsFor(item).forEach((o) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = o.text;
        b.setAttribute('data-correct', String(o.correct));
        b.addEventListener('click', () => {
          if (target.hasAttribute('data-answered')) return;
          target.setAttribute('data-answered', '');
          b.classList.add(o.correct ? 'sem-answered' : 'sem-wrong-pick');
          if (o.correct) score.correct++;
          score.answered++;
          progress.textContent =
            (i + 1) + '/' + items.length + ' · score ' + score.correct + '/' + score.answered;
        });
        target.appendChild(b);
      });
    }

    function render(): void {
      const item = items[i];
      items.forEach((f, k) => {
        f.classList.toggle('sem-current', k === i);
        f.classList.remove('sem-flipped');
      });
      if (view === 'flashcards') {
        progress.textContent = (i + 1) + '/' + items.length;
      } else {
        progress.textContent = (i + 1) + '/' + items.length;
        renderQuiz(item);
      }
    }

    chrome.addEventListener('click', (e) => {
      const target = e.target as Element;
      const act = target.getAttribute && target.getAttribute('data-act');
      if (!act) return;
      if (act === 'prev') { i = (i - 1 + items.length) % items.length; render(); }
      if (act === 'next') { i = (i + 1) % items.length; render(); }
      if (act === 'flip' || target.closest('.sem-fact')) {
        items[i].classList.toggle('sem-flipped');
      }
    });

    if (view === 'flashcards') {
      items.forEach((f) => {
        f.addEventListener('click', () => f.classList.toggle('sem-flipped'));
      });
    }
    render();
  });
}
