# Artikel Swipe 🇩🇪

A cute Tinder-style German article trainer built with Vite, React, JavaScript and Tailwind CSS.

## Controls

- Swipe left → **die**
- Swipe right → **der**
- Swipe up → **das**
- Swipe down → **den**
- Correct = **+1**
- Wrong = **−1**
- Desktop keyboard arrows are supported.
- Search finds words, English meanings and categories.

## Data

`src/data/vocabulary.json` is the supplied 2,000-entry dataset. It contains 500 entries each for `die`, `der`, `das`, and `den`. The `den` group represents masculine nouns in the accusative case.

## Run

```bash
npm install
npm run dev
```

For production:

```bash
npm run build
npm run preview
```
