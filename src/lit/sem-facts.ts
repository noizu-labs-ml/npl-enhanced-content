import { SemElement } from './base.js';
import { randomFor, shuffle } from '../shared/rng.js';

/**
 * sem-facts — Lit upgrade of the v0.4 class-based fact collection.
 * Light DOM per PRD §4 rule 5; Lit owns the flashcard/quiz behavior,
 * not the markup. Handoff contract comes from SemElement. Chrome meter is
 * .sem-facts-meter — never .sem-progress (D1: that class is the
 * sem-progress element).
 *
 * Quiz option order is a seeded Fisher-Yates draw (shared/rng), not a
 * `sort(() => Math.random() - .5)` comparator. The old comparator was
 * inconsistent, so its output was both non-uniform and engine-dependent.
 */
export class SemFacts extends SemElement {
  #wired = false;
  #awaitingItems = false;

  updated(): void {
    if (this.#wired) return;
    const view = this.getAttribute('data-view-as') || 'list';
    const items = Array.from(this.querySelectorAll(':scope > .sem-fact'));
    if (items.length === 0) {
      // element upgraded pre-parse: children aren't there yet at first update
      this.#awaitItems();
      return;
    }
    if (view === 'list') return; // nothing interactive; plain layout stays
    this.#wired = true;

    const rand = randomFor(this);

    const chrome = document.createElement('div');
    chrome.className = 'sem-facts-chrome';
    chrome.innerHTML =
      '<button type="button" data-act="prev" aria-label="previous">←</button>' +
      '<span class="sem-facts-meter"></span>' +
      '<button type="button" data-act="next" aria-label="next">→</button>';
    this.insertBefore(chrome, this.firstChild);

    let i = 0;
    const score = { correct: 0, answered: 0 };
    const meter = chrome.querySelector('.sem-facts-meter')!;

    const optionsFor = (item: Element) => {
      const correct = item.querySelector('.sem-conclusion');
      const distractors = Array.from(item.querySelectorAll('.sem-distractor'));
      const others = items
        .filter((f) => f !== item)
        .map((f) => f.querySelector('.sem-conclusion'))
        .filter(Boolean) as Element[];
      const opts = distractors.concat(others).slice(0, 3).concat([correct!]);
      return shuffle(opts, rand).map((el) => ({
        text: (el.textContent || '').trim(),
        correct: el === correct,
      }));
    };

    const renderQuiz = (item: Element) => {
      let box = item.querySelector('.sem-quiz-options') as HTMLDivElement | null;
      if (!box) {
        box = document.createElement('div');
        box.className = 'sem-quiz-options';
        item.appendChild(box);
      }
      box.innerHTML = '';
      optionsFor(item).forEach((o) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = o.text;
        b.setAttribute('data-correct', String(o.correct));
        b.addEventListener('click', () => {
          if (box!.hasAttribute('data-answered')) return;
          box!.setAttribute('data-answered', '');
          b.classList.add(o.correct ? 'sem-answered' : 'sem-wrong-pick');
          if (o.correct) score.correct++;
          score.answered++;
          meter.textContent =
            (i + 1) + '/' + items.length + ' · score ' + score.correct + '/' + score.answered;
        });
        box!.appendChild(b);
      });
    };

    const render = () => {
      items.forEach((f, k) => {
        f.classList.toggle('sem-current', k === i);
        f.classList.remove('sem-flipped');
      });
      meter.textContent = (i + 1) + '/' + items.length;
      if (view === 'quiz') renderQuiz(items[i]);
    };

    chrome.addEventListener('click', (e) => {
      const act = (e.target as Element).getAttribute?.('data-act');
      if (act === 'prev') { i = (i - 1 + items.length) % items.length; render(); }
      if (act === 'next') { i = (i + 1) % items.length; render(); }
    });

    if (view === 'flashcards') {
      items.forEach((f) => {
        f.addEventListener('click', () => f.classList.toggle('sem-flipped'));
      });
    }
    render();
  }

  #awaitItems(): void {
    if (this.#awaitingItems) return;
    this.#awaitingItems = true;
    void this.whenChildrenReady(':scope > .sem-fact').then(() => {
      this.#awaitingItems = false;
      this.requestUpdate();
    });
  }
}

SemElement.register('sem-facts', SemFacts);
