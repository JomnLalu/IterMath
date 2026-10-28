# IterMath

Short math drills for arithmetic and counting. Answer a question, get instant feedback, and see the full working whenever you miss.

**Live site:** https://itermath.jomontolalu.com

**Source:** https://github.com/JomnLalu/IterMath

## Modules

| Module | Path | What it drills |
| --- | --- | --- |
| Addition | `/addition` | Two 2-digit numbers |
| Subtraction | `/subtraction` | Two 2-digit numbers, never a negative answer |
| Multiplication | `/multiplication` | Times tables from 2 × 2 to 12 × 12 |
| Division | `/division` | Divisors 2 to 12, whole-number answers |
| Mixed operations | `/arithmetics` | All four operations with brackets; answers can be negative |
| Combinations | `/combination` | C(n, k) for n from 4 to 9 |
| Permutations | `/permutation` | P(n, k) for n from 3 to 8 |

A correct answer moves straight to the next question. A wrong answer shows the right result, what you entered, and a step-by-step solution.

## How it's built

Plain HTML, CSS and JavaScript. There is no build step, no framework and no third-party scripts, and the math is drawn with HTML and CSS rather than a math library, so pages load instantly.

```
index.html              Home page with module search
<module>/index.html     One page per module, each defines its own question generator
assets/
  style.css             Shared design tokens and components
  practice.js           Shared practice engine and math rendering helpers
  itermath-logo.svg     Logo
  favicon.svg           Favicon
  apple-touch-icon.png  iOS home-screen icon
  og.png                Link preview image (1200 × 630)
```

## Run locally

Asset paths start with `/`, so serve the folder rather than opening the files directly:

```sh
python -m http.server 8000
```

Then open http://localhost:8000.

## Adding a module

1. Copy an existing module folder, for example `addition/`, and rename it.
2. Update the title, description, canonical URL and `og:` tags in the `<head>`.
3. Replace the `generate` function. It must return:

   ```js
   {
     question: '12 + 34',            // HTML; " = ?" is added for you
     answer: 46,                     // integer
     solution: M.column(12, '+', 34, 46)  // HTML shown on a wrong answer
   }
   ```

   Helpers on `M`: `rand`, `pick`, `fact`, `num`, `operand`, `sym`, `frac`, `column` and `steps`. Set `allowNegative: true` if answers can be below zero.
4. Add a card for it to `index.html`.

## Author

Built by [Jonathan Montolalu](https://jomontolalu.com).
