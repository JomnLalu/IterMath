/* IterMath practice engine.
   Each module page calls IterMath.practice({ generate, allowNegative }).
   generate() returns { question: html, answer: number, solution: html }. */
(function () {
  'use strict';

  var MINUS = '−';

  var H = {
    rand: function (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    pick: function (list) { return list[Math.floor(Math.random() * list.length)]; },
    fact: function (n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; },
    /* Signed number with a true minus sign */
    num: function (x) { return x < 0 ? MINUS + Math.abs(x) : String(x); },
    /* Wrap negatives in brackets when they are an operand */
    operand: function (x) { return x < 0 ? '(' + H.num(x) + ')' : String(x); },
    sym: function (op) { return { '+': '+', '-': MINUS, '*': '×', '/': '÷' }[op]; },
    frac: function (top, bottom) {
      return '<span class="frac"><span>' + top + '</span><span>' + bottom + '</span></span>';
    },
    /* Vertical working: a over (op b), rule, result */
    column: function (a, op, b, result) {
      return '<div class="column"><span></span><span>' + a + '</span><span>' + H.sym(op) +
        '</span><span>' + b + '</span><span class="rule"></span><strong>' + result + '</strong></div>';
    },
    /* Aligned equation steps: [[left, right], ...] */
    steps: function (rows) {
      return '<div class="steps">' + rows.map(function (r) {
        return '<span>' + (r[0] || '') + '</span><span>' + r[1] + '</span>';
      }).join('') + '</div>';
    }
  };

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function practice(cfg) {
    var form = document.getElementById('form');
    var input = document.getElementById('answer');
    var button = document.getElementById('action');
    var error = document.getElementById('error');
    var question = document.getElementById('question');
    var feedback = document.getElementById('feedback');

    var pattern = cfg.allowNegative ? /^-?\d+$/ : /^\d+$/;
    var state = 'answering';
    var current = null;
    var last = '';

    function next(initial) {
      var q, tries = 0;
      do { q = cfg.generate(); } while (q.question === last && ++tries < 6);
      last = q.question;
      current = q;

      question.innerHTML = '<span>' + q.question + ' = <span class="muted">?</span></span>';
      question.classList.toggle('question--long', question.textContent.length > 12);
      question.classList.remove('is-entering');
      void question.offsetWidth;
      question.classList.add('is-entering');

      input.value = '';
      input.readOnly = false;
      clearError();
      feedback.innerHTML = '';
      button.textContent = 'Check';
      button.disabled = false;
      button.removeAttribute('aria-busy');
      state = 'answering';
      input.focus({ preventScroll: !!initial });
    }

    function showError(message) {
      error.textContent = message;
      error.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
    }

    function clearError() {
      error.hidden = true;
      error.textContent = '';
      input.removeAttribute('aria-invalid');
    }

    function check() {
      var raw = input.value.trim().replace(/−/g, '-');
      if (input.validity && input.validity.badInput) return showError('Enter a whole number.');
      if (raw === '') return showError('Enter an answer first.');
      if (!pattern.test(raw)) return showError(cfg.allowNegative ? 'Enter a whole number.' : 'Use digits only.');

      var value = parseInt(raw, 10);

      if (value === current.answer) {
        state = 'advancing';
        feedback.innerHTML = '<div class="result result--correct">Correct</div>';
        button.setAttribute('aria-busy', 'true');
        button.disabled = true;
        setTimeout(function () { next(false); }, 600);
        return;
      }

      state = 'review';
      input.readOnly = true;
      feedback.innerHTML =
        '<div class="result result--wrong">' +
          '<p class="result-title">The answer is ' + H.num(current.answer) + '</p>' +
          '<p class="result-sub small muted">You entered ' + H.num(value) + '.</p>' +
          '<div class="solution">' + current.solution + '</div>' +
        '</div>';
      button.textContent = 'Next';
      button.focus({ preventScroll: true });
      feedback.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (state === 'answering') check();
      else if (state === 'review') next(false);
    });

    input.addEventListener('input', function () {
      if (!error.hidden) clearError();
    });

    next(true);
  }

  H.practice = practice;
  window.IterMath = H;
})();
