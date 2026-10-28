/* IterMath practice engine.
   Each module page calls IterMath.practice({ generate, input, allowNegative }).

   generate() returns:
     question  HTML for the exercise. " = ?" is appended unless ask is set.
     answer    One of:
                 number           exact match (integers or terminating decimals)
                 M.Q(n, d)        exact fraction; equal decimals and mixed numbers count
                 [a, b, ...]      several values, typed with commas (set ordered: true for pairs)
                 'string'         text answer, compared after normalising (see accept)
     solution  HTML shown on a wrong answer.
   Optional:
     prompt    Instruction shown above the question, e.g. "Solve for x."
     ask       Text after the question instead of " = ?", or false for none.
     places    Round to this many decimal places; answers within half a unit count.
     form      'fraction' | 'mixed' | 'decimal' to require that written form.
     simplest  Fractions must be fully reduced (default for fraction answers).
     ordered   For list answers: order matters, e.g. (x, y).
     accept    Extra accepted spellings for text answers.
     check     function (raw) -> true | false | 'error message' for custom marking.
     display   HTML for the correct answer if the default formatting is not right.
     hint      Format hint shown under the input for this question.
     placeholder  Input placeholder for this question.

   Module options:
     input          'number' for the general parser. Leave unset for whole-number drills.
     allowNegative  Whole-number drills only: allow answers below zero. */
(function () {
  'use strict';

  var MINUS = '−';

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; }
  function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }

  /* Rationals: always reduced, denominator positive */
  function Q(n, d) {
    if (d === undefined) d = 1;
    if (d === 0) throw new Error('Zero denominator');
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    return { n: n / g || 0, d: d / g, isQ: true };
  }
  function toQ(x) {
    if (x && x.isQ) return x;
    var s = String(parseFloat(Math.abs(x).toFixed(10)));
    var neg = x < 0, i = s.indexOf('.');
    if (i < 0) return Q(neg ? -parseInt(s, 10) : parseInt(s, 10), 1);
    var k = s.length - i - 1, digits = parseInt(s.replace('.', ''), 10);
    return Q(neg ? -digits : digits, Math.pow(10, k));
  }
  function qeq(a, b) { a = toQ(a); b = toQ(b); return a.n * b.d === b.n * a.d; }
  function qval(a) { return a.isQ ? a.n / a.d : a; }

  var H = {
    rand: function (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    /* Random integer in range, never zero */
    randNZ: function (min, max) { var x; do { x = H.rand(min, max); } while (x === 0); return x; },
    pick: function (list) { return list[Math.floor(Math.random() * list.length)]; },
    shuffle: function (list) {
      var a = list.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    },
    fact: function (n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; },
    gcd: gcd,
    lcm: lcm,
    isPrime: function (n) { if (n < 2) return false; for (var i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; },
    primeFactors: function (n) { var f = []; for (var p = 2; p * p <= n; p++) while (n % p === 0) { f.push(p); n /= p; } if (n > 1) f.push(n); return f; },
    /* Round to a number of decimal places without float noise */
    round: function (x, places) { var m = Math.pow(10, places || 0); return Math.round((x + (x >= 0 ? 1e-9 : -1e-9)) * m) / m; },

    Q: Q,
    toQ: toQ,
    qeq: qeq,
    qadd: function (a, b) { a = toQ(a); b = toQ(b); return Q(a.n * b.d + b.n * a.d, a.d * b.d); },
    qsub: function (a, b) { a = toQ(a); b = toQ(b); return Q(a.n * b.d - b.n * a.d, a.d * b.d); },
    qmul: function (a, b) { a = toQ(a); b = toQ(b); return Q(a.n * b.n, a.d * b.d); },
    qdiv: function (a, b) { a = toQ(a); b = toQ(b); return Q(a.n * b.d, a.d * b.n); },

    /* Signed number with a true minus sign and no float noise */
    num: function (x) {
      if (x && x.isQ) return H.q(x);
      var s = String(parseFloat(Math.abs(x).toFixed(10)));
      return (x < 0 && s !== '0' ? MINUS : '') + s;
    },
    /* Wrap negatives in brackets when they are an operand */
    operand: function (x) { return (x && x.isQ ? x.n < 0 : x < 0) ? '(' + H.num(x) + ')' : H.num(x); },
    sym: function (op) { return { '+': '+', '-': MINUS, '*': '×', '/': '÷' }[op]; },
    frac: function (top, bottom) {
      return '<span class="frac"><span>' + top + '</span><span>' + bottom + '</span></span>';
    },
    /* A rational as HTML: integer, stacked fraction, or mixed number */
    q: function (x, mixed) {
      x = toQ(x);
      if (x.d === 1) return H.num(x.n);
      var sign = x.n < 0 ? MINUS : '', n = Math.abs(x.n);
      if (mixed && n > x.d) return sign + Math.floor(n / x.d) + H.frac(n % x.d, x.d);
      return sign + H.frac(n, x.d);
    },
    /* A rational as plain text: 3/4, -2, 1 1/2 */
    qtext: function (x, mixed) {
      x = toQ(x);
      if (x.d === 1) return String(x.n);
      var sign = x.n < 0 ? '-' : '', n = Math.abs(x.n);
      if (mixed && n > x.d) return sign + Math.floor(n / x.d) + ' ' + (n % x.d) + '/' + x.d;
      return sign + n + '/' + x.d;
    },
    v: function (name) { return '<i>' + name + '</i>'; },
    pow: function (base, exp) { return base + '<sup>' + exp + '</sup>'; },
    sqrt: function (x, index) {
      return (index ? '<sup class="root-index">' + index + '</sup>' : '') + '<span class="sqrt">√<span>' + x + '</span></span>';
    },
    abs: function (x) { return '|' + x + '|'; },
    /* Join signed terms: [[3, 'x²'], [-2, 'x'], [5, '']] -> 3x² − 2x + 5. A coefficient may be a Q. */
    terms: function (list) {
      var out = '';
      list.forEach(function (t) {
        var c = toQ(t[0]), v = t[1] || '';
        if (c.n === 0) return;
        var neg = c.n < 0, a = Q(Math.abs(c.n), c.d);
        var body = (a.n === 1 && a.d === 1 && v) ? v : H.q(a) + v;
        if (!out) out = (neg ? MINUS : '') + body;
        else out += (neg ? ' ' + MINUS + ' ' : ' + ') + body;
      });
      return out || '0';
    },
    /* Polynomial from coefficients, highest power first */
    poly: function (coeffs, name) {
      var x = '<i>' + (name || 'x') + '</i>', deg = coeffs.length - 1;
      return H.terms(coeffs.map(function (c, i) {
        var p = deg - i;
        return [c, p === 0 ? '' : p === 1 ? x : x + '<sup>' + p + '</sup>'];
      }));
    },
    /* Polynomial as typed text: 3x^2-2x+5 */
    polyText: function (coeffs, name) {
      var x = name || 'x', deg = coeffs.length - 1, out = '';
      coeffs.forEach(function (c, i) {
        c = toQ(c);
        if (c.n === 0) return;
        var p = deg - i, a = Q(Math.abs(c.n), c.d);
        var cs = a.d === 1 ? String(a.n) : a.n + '/' + a.d;
        var body = p === 0 ? cs : (cs === '1' ? '' : cs) + x + (p > 1 ? '^' + p : '');
        out += (c.n < 0 ? '-' : out ? '+' : '') + body;
      });
      return out || '0';
    },
    /* Right triangle, right angle bottom left, marked angle bottom right.
       labels: { opp, adj, hyp, angle } — opp is the left side, adj the base. */
    triangle: function (l) {
      var t = function (x, y, a, s) { return s == null ? '' : '<text x="' + x + '" y="' + y + '" text-anchor="' + a + '">' + s + '</text>'; };
      return '<svg class="figure" viewBox="0 0 240 150" width="240" height="150" role="img" aria-label="Right triangle">' +
        '<path d="M40 120 H200 L40 30 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M40 108 H52 V120" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
        (l.angle != null ? '<path d="M174 120 A26 26 0 0 1 177.3 107.3" fill="none" stroke="currentColor" stroke-width="1.5"/>' : '') +
        t(30, 80, 'end', l.opp) + t(120, 142, 'middle', l.adj) + t(128, 66, 'start', l.hyp) + t(162, 113, 'end', l.angle) +
        '</svg>';
    },
    /* Matrix or determinant: rows of cells */
    matrix: function (rows, det) {
      return '<span class="matrix' + (det ? ' matrix--det' : '') + '" style="grid-template-columns:repeat(' + rows[0].length + ',auto)">' +
        rows.map(function (r) { return r.map(function (c) { return '<span>' + H.num(c) + '</span>'; }).join(''); }).join('') + '</span>';
    },
    /* Stacked operator with limits: ∫ from a to b, lim under it */
    integral: function (a, b) {
      return '<span class="bigop"><span class="bigop-sign">∫</span><span class="bigop-limits"><span>' + b + '</span><span>' + a + '</span></span></span>';
    },
    lim: function (under) { return '<span class="lim"><span>lim</span><span>' + under + '</span></span>'; },
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
    },
    note: function (html) { return '<p class="solution-note">' + html + '</p>'; },
    esc: function (s) {
      return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
    }
  };

  /* ---------- Reading answers ---------- */

  function clean(s) {
    return String(s).trim().replace(/[−–—]/g, '-').replace(/\s+/g, ' ');
  }

  /* Parse one number: 12, -3, 2.5, .5, 3/4, -1 1/2, 1,200. Returns { value, kind, reduced } or null. */
  function parseNumber(s, allowThousands) {
    s = clean(s).replace(/^[a-zθ]\s*=\s*/i, '').replace(/^\+/, '');
    var m;
    if (allowThousands && /^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
    if ((m = /^(-?)(\d+)$/.exec(s))) return { value: Q((m[1] ? -1 : 1) * parseInt(m[2], 10), 1), kind: 'int', reduced: true };
    if ((m = /^(-?)(\d*)\.(\d+)$/.exec(s)) || (m = /^(-?)(\d+)\.()$/.exec(s))) {
      var digits = parseInt((m[2] || '0') + m[3], 10), d = Math.pow(10, m[3].length);
      return { value: Q((m[1] ? -1 : 1) * digits, d), kind: 'dec', reduced: true };
    }
    if ((m = /^(-?)(\d+) ?\/ ?(\d+)$/.exec(s))) {
      var n = parseInt(m[2], 10), den = parseInt(m[3], 10);
      if (!den) return null;
      return { value: Q((m[1] ? -1 : 1) * n, den), kind: 'frac', reduced: gcd(n, den) === 1 };
    }
    if ((m = /^(-?)(\d+) (\d+) ?\/ ?(\d+)$/.exec(s))) {
      var w = parseInt(m[2], 10), fn = parseInt(m[3], 10), fd = parseInt(m[4], 10);
      if (!fd || fn >= fd) return null;
      return { value: Q((m[1] ? -1 : 1) * (w * fd + fn), fd), kind: 'mixed', reduced: gcd(fn, fd) === 1 };
    }
    return null;
  }

  function normText(s) {
    return clean(s).toLowerCase()
      .replace(/square ?root|sqrt|√/g, '√')
      .replace(/<=|=<|≤/g, '≤').replace(/>=|=>|≥/g, '≥')
      .replace(/\*\*/g, '^').replace(/[*·×]/g, '×')
      .replace(/π/g, 'pi')
      .replace(/[\s()[\]{}]/g, '');
  }

  /* ---------- Expression answers ---------- */

  /* Polynomial in one variable -> { power: Q }. Accepts 3x^2 - 2x + 5, x²+1, 2/3x, x^3/3. */
  function parsePoly(s, v) {
    v = v || 'x';
    s = clean(s).toLowerCase().replace(/\s+/g, '').replace(/\*\*/g, '^').replace(/[*·×]/g, '')
      .replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4').replace(/⁵/g, '^5');
    if (!s || /[^0-9.+\-/^a-z]/.test(s)) return null;
    var re = new RegExp('^([+-]?)(\\d+(?:\\.\\d+)?)?(?:/(\\d+))?(' + v + '(?:\\^(\\d+))?)?(?:/(\\d+))?$');
    var parts = s.replace(/([^^])([+-])/g, '$1|$2').split('|');
    var out = {};
    for (var i = 0; i < parts.length; i++) {
      var t = parts[i];
      if (t === '') { if (i === 0) continue; return null; }
      var m = re.exec(t);
      if (!m || (!m[2] && !m[4])) return null;
      var c = m[2] ? toQ(parseFloat(m[2])) : Q(1);
      if (m[3]) c = H.qdiv(c, Q(parseInt(m[3], 10)));
      if (m[6]) c = H.qdiv(c, Q(parseInt(m[6], 10)));
      if (m[1] === '-') c = Q(-c.n, c.d);
      var p = m[4] ? (m[5] ? parseInt(m[5], 10) : 1) : 0;
      out[p] = out[p] ? H.qadd(out[p], c) : c;
    }
    return out;
  }
  function polyFrom(coeffs) {
    var out = {}, deg = coeffs.length - 1;
    coeffs.forEach(function (c, i) { out[deg - i] = toQ(c); });
    return out;
  }
  function polyEq(a, b) {
    var keys = {}, k;
    for (k in a) keys[k] = 1;
    for (k in b) keys[k] = 1;
    for (k in keys) if (!qeq(a[k] || Q(0), b[k] || Q(0))) return false;
    return true;
  }
  function polyMul(a, b) {
    var out = {};
    for (var i in a) for (var j in b) {
      var p = +i + +j, c = H.qmul(a[i], b[j]);
      out[p] = out[p] ? H.qadd(out[p], c) : c;
    }
    return out;
  }
  function polyDeg(a) {
    var d = -1;
    for (var k in a) if (a[k].n !== 0 && +k > d) d = +k;
    return d;
  }

  /* Expanded polynomial answer, coefficients highest power first */
  H.polyCheck = function (coeffs, v, example) {
    var want = polyFrom(coeffs);
    return function (raw) {
      raw = clean(raw).replace(/^(?:[a-z]+['′]*\s*\(\s*[a-z]\s*\)|[a-z]['′]*|dy\/dx)\s*=\s*/i, '');
      if (/[()]/.test(raw)) return 'Expand fully, without brackets.';
      var got = parsePoly(raw, v);
      if (!got) return 'Type it like ' + (example || '3x^2 - 2x + 5') + '.';
      return polyEq(got, want);
    };
  };

  /* Fully factored answer such as (x + 3)(x - 5), 2(x + 1)(x - 4) or (x - 3)^2 */
  H.factorCheck = function (coeffs, v) {
    v = v || 'x';
    var want = polyFrom(coeffs);
    return function (raw) {
      var s = clean(raw).toLowerCase().replace(/\s+/g, '').replace(/[*·×]/g, '').replace(/²/g, '^2').replace(/\)\(/g, ')(');
      var m = /^([+-]?\d*(?:[a-z])?)((?:\([^()]+\)(?:\^2)?)+)$/.exec(s);
      if (!m) return 'Write it as brackets multiplied together, like (x + 2)(x - 5).';
      var lead = m[1] === '' || m[1] === '+' ? { 0: Q(1) } : m[1] === '-' ? { 0: Q(-1) } : parsePoly(m[1], v);
      if (!lead) return 'Write it as brackets multiplied together, like (x + 2)(x - 5).';
      var product = lead, linear = true, count = polyDeg(lead) === 1 ? 1 : 0;
      var groups = m[2].match(/\([^()]+\)(\^2)?/g);
      for (var i = 0; i < groups.length; i++) {
        var g = groups[i], sq = /\^2$/.test(g);
        var inner = parsePoly(g.replace(/\^2$/, '').slice(1, -1), v);
        if (!inner) return 'Check the expression inside each bracket.';
        if (polyDeg(inner) !== 1) linear = false;
        else if (inner[1].d === 1 && (!inner[0] || inner[0].d === 1) && gcd(inner[1].n, inner[0] ? inner[0].n : 0) > 1) linear = false;
        product = polyMul(product, inner);
        count++;
        if (sq) { product = polyMul(product, inner); count++; }
      }
      if (!polyEq(product, want)) return false;
      if (!linear || count < 2) return 'That multiplies back correctly. Now factor it completely.';
      return true;
    };
  };

  /* Complex number a + bi in any order */
  H.complexCheck = function (re, im) {
    return H.polyCheck([im, re], 'i', '3 + 2i');
  };

  /* Simplified radical k√r */
  H.radicalCheck = function (k, r) {
    return function (raw) {
      var t = normText(raw).replace(/^\+/, '');
      if (/^-?\d+$/.test(t)) return r === 1 && parseInt(t, 10) === k;
      var m = /^(-?\d*)×?√(\d+)$/.exec(t);
      if (!m) return 'Type it like 6√2 or 6 sqrt 2.';
      var a = m[1] === '' ? 1 : m[1] === '-' ? -1 : parseInt(m[1], 10), b = parseInt(m[2], 10);
      if (a * a * b !== k * k * r || (a < 0) !== (k < 0)) return false;
      return b === r ? true : 'Right value. Simplify the radical further.';
    };
  };

  /* Answer of k·π rounded, accepting either the calculator π or 3.14 */
  H.piCheck = function (k, places) {
    var tol = 0.5 * Math.pow(10, -places) + 1e-9;
    return function (raw) {
      var p = parseNumber(raw, true);
      if (!p) return 'Enter a number, like 12.6.';
      var v = qval(p.value);
      return Math.abs(v - k * Math.PI) <= tol || Math.abs(v - k * 3.14) <= tol;
    };
  };

  H.parsePoly = parsePoly;
  H.polyFrom = polyFrom;
  H.polyEq = polyEq;
  H.normText = normText;

  function sameNumber(q, got) {
    if (q.places != null) {
      var tol = 0.5 * Math.pow(10, -q.places) + 1e-9;
      return Math.abs(qval(got) - qval(q.answer)) <= tol;
    }
    return qeq(got, q.answer);
  }

  /* Returns { ok: bool } or { error: 'message' } */
  function mark(q, raw, cfg) {
    var s = clean(raw);
    if (s === '') return { error: 'Enter an answer first.' };

    if (q.check) {
      var r = q.check(s);
      return typeof r === 'string' ? { error: r } : { ok: !!r };
    }

    if (typeof q.answer === 'string') {
      var given = normText(s);
      var list = [q.answer].concat(q.accept || []).map(normText);
      return { ok: list.indexOf(given) !== -1 };
    }

    if (Array.isArray(q.answer)) {
      var parts = s.replace(/^[([{]\s*|\s*[)\]}]$/g, '').split(/\s*[,;]\s*|\s+and\s+|\s+or\s+/i);
      if (parts.length !== q.answer.length) {
        return { error: 'Enter ' + q.answer.length + ' values separated by a comma.' };
      }
      var vals = [];
      for (var i = 0; i < parts.length; i++) {
        var p = parseNumber(parts[i], false);
        if (!p) return { error: 'Use numbers like 4, −3, 2.5 or 3/4, separated by a comma.' };
        vals.push(p.value);
      }
      if (q.ordered) {
        return { ok: q.answer.every(function (a, k) { return sameNumber({ answer: a, places: q.places }, vals[k]); }) };
      }
      var left = q.answer.slice();
      var ok = vals.every(function (v) {
        for (var k = 0; k < left.length; k++) {
          if (sameNumber({ answer: left[k], places: q.places }, v)) { left.splice(k, 1); return true; }
        }
        return false;
      });
      return { ok: ok };
    }

    /* Whole-number drills keep their original strict input */
    if (!cfg.input) {
      if (!(cfg.allowNegative ? /^-?\d+$/ : /^\d+$/).test(s)) {
        return { error: cfg.allowNegative ? 'Enter a whole number.' : 'Use digits only.' };
      }
      return { ok: parseInt(s, 10) === q.answer };
    }

    var got = parseNumber(s, true);
    if (!got) return { error: 'Enter a number, like 12, −3, 2.5, 3/4 or 1 1/2.' };

    var right = sameNumber(q, got.value);
    var isFracAnswer = q.answer && q.answer.isQ && q.answer.d !== 1;
    if (right) {
      if (q.form === 'fraction' && got.kind === 'dec') return { error: 'Write the answer as a fraction, like 3/4.' };
      if (q.form === 'decimal' && (got.kind === 'frac' || got.kind === 'mixed')) return { error: 'Write the answer as a decimal.' };
      if (q.form === 'mixed' && (got.kind === 'dec' || (got.kind === 'frac' && Math.abs(got.value.n) > got.value.d))) return { error: 'Write it as a mixed number, like 2 1/3.' };
      if (q.form === 'improper' && (got.kind === 'dec' || got.kind === 'mixed')) return { error: 'Write it as an improper fraction, like 7/3.' };
      if ((q.simplest || (q.simplest !== false && isFracAnswer)) && !got.reduced) return { error: 'Right value. Now simplify the fraction.' };
    }
    return { ok: right };
  }

  function displayAnswer(q) {
    if (q.display != null) return q.display;
    var a = q.answer;
    if (Array.isArray(a)) {
      var s = a.map(function (x) { return H.num(x); }).join(', ');
      return q.ordered ? '(' + s + ')' : s;
    }
    if (a && a.isQ) return H.q(a, q.form === 'mixed');
    if (typeof a === 'number') return H.num(a);
    return H.esc(a);
  }

  /* ---------- Practice loop ---------- */

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function practice(cfg) {
    var form = document.getElementById('form');
    var input = document.getElementById('answer');
    var button = document.getElementById('action');
    var error = document.getElementById('error');
    var question = document.getElementById('question');
    var feedback = document.getElementById('feedback');
    var hint = document.getElementById('hint');

    var defaultPlaceholder = input.getAttribute('placeholder') || 'Answer';
    var defaultHint = hint ? hint.textContent : '';
    var state = 'answering';
    var current = null;
    var last = '';

    function next(initial) {
      var q, tries = 0;
      do { q = cfg.generate(); } while (q.question + (q.prompt || '') === last && ++tries < 6);
      last = q.question + (q.prompt || '');
      current = q;

      var suffix = q.ask === false ? '' : q.ask != null ? ' ' + q.ask : ' = <span class="muted">?</span>';
      var main = document.createElement('span');
      main.className = 'question-main';
      main.innerHTML = q.question + suffix;
      var len = main.textContent.length;

      question.innerHTML = q.prompt ? '<span class="question-prompt">' + q.prompt + '</span>' : '';
      question.appendChild(main);
      question.classList.toggle('question--long', len > 12 && len <= 22);
      question.classList.toggle('question--xl', len > 22);
      question.classList.remove('is-entering');
      void question.offsetWidth;
      question.classList.add('is-entering');

      input.value = '';
      input.readOnly = false;
      input.placeholder = q.placeholder || defaultPlaceholder;
      if (hint) {
        hint.textContent = q.hint != null ? q.hint : defaultHint;
        hint.hidden = !hint.textContent;
      }
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
      if (input.validity && input.validity.badInput) return showError('Enter a whole number.');
      var res = mark(current, input.value, cfg);
      if (res.error) return showError(res.error);

      if (res.ok) {
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
          '<p class="result-title">The answer is ' + displayAnswer(current) + '</p>' +
          '<p class="result-sub small muted">You entered ' + H.esc(clean(input.value).replace(/^-(?=\d)/, MINUS)) + '.</p>' +
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
  H.mark = mark;
  H.parseNumber = parseNumber;
  H.displayAnswer = displayAnswer;
  window.IterMath = H;
})();
