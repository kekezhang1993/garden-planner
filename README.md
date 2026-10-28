# Garden Planner

Plan a garden bed: pick plants that fit your hardiness zone, place them in a top-down plan or a
perspective garden view, check sun and shade, and dial through the four seasons to see how it changes.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Updating plant photos

Plant photos are linked from [iNaturalist](https://www.inaturalist.org). After adding plants to
`src/data/plants.ts`, fetch photo links and credits with:

```bash
npm run photos
```

## Deploying

Every push to `main` builds the site and publishes it to GitHub Pages
(`.github/workflows/deploy.yml`). One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

The site uses the custom domain in `public/CNAME` (verdial.app). Delete that file to go back to
`<user>.github.io/garden-planner/`.

## Credits

- Plant photos come from iNaturalist contributors under the Creative Commons license shown with each
  photo. Only openly licensed photos are used, and each one links to its original page and license.
  Many are licensed non-commercial (CC BY-NC), so this project must stay non-commercial while it uses them.
- Hardiness zones by ZIP code are from [phzmapi.org](https://phzmapi.org), based on the USDA 2023
  Plant Hardiness Zone Map.
- Your yard photo and garden layout are saved only in your own browser; nothing is uploaded.
