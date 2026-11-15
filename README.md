# Noah's Big Boat — Coloring Edition 🖍️

**▶ Play (phone, iPad, or any browser):** https://williammorgansgrokbot.github.io/noah-coloring/
**🖨️ Print the coloring pages (PDF):** https://williammorgansgrokbot.github.io/noah-coloring/pages/Coloring_pages.pdf

Kids color two printable Noah's Ark pages. Take a photo of each colored page **inside the game** and the animals, Noah, the ark, the cloud, the rainbow, the rock and the puddle turn into stickers that appear in the game. The painted art comes back for anything you haven't added.

## How to use it
1. **Print** the PDF at **100%** ("Actual size" — *not* "Fit to page"; the black corner squares must stay square and the right size). Two pages: Page 1 (lion, elephant, giraffe, sheep, duck, Noah) and Page 2 (ark, cloud, rainbow, rock, puddle).
2. **Color** with bold crayons or markers. Stay inside the boxes if you can. Dark, bright colors work best; very pale pencil can fade.
3. **Photo:** lay the page flat in good light (no big shadows). Keep **all 4 black corner squares** in the picture and fill the frame. Tilted or sideways is fine — the game straightens it and works out which page it is from the dots at the bottom (1 dot = Page 1, 2 dots = Page 2).
4. Open the game → **🎨 Class Art** → **📷 Add colored page** → take a photo (or choose one from your library). Do both pages.
5. Switch **Class art: ON / OFF** any time. **Redo** or **Clear** one picture, or **Clear all**.

## Privacy
Everything happens in the phone's browser. There is no server and nothing is uploaded — the photo is read on the device, the cut-outs are saved only in that browser (IndexedDB), and the game loads no outside fonts or scripts. Different phones/browsers keep their own art.

## Phone notes
- **iPhone photos (HEIC):** if a photo won't open, go to Settings › Camera › Formats › **Most Compatible**, then retake it (or use a screenshot / JPG). The game shows these steps if a photo can't be read.
- Works on older iPads (iPadOS 13): all art is PNG/JPEG (no WebP) and the code avoids newer JavaScript.
- If the game shows "Turn your phone sideways", there is a Class Art button right on that screen so you can add photos while holding the phone upright.
- Private Browsing may not allow saving; the art then lasts only until the page is closed.

## For developers
- `index.html` is the whole game (built; self-contained). Source in `src/`; rebuild with `python3 src/build.py`.
- `src/classart.js` is the on-device photo pipeline: find the four black squares → 8-point homography (perspective straightening) → page-ID dots → per-box cut with local lighting flattening and paper flood-fill → PNG data-URL in IndexedDB. Pure canvas, no libraries.
- `src/layout.json` holds the box positions (points on a US-Letter page); `pages/` has the page images used for tests.
- Tests: `python3 test/simulate.py OUTDIR` makes fake colored/warped/dim/rotated "photos"; `python3 test/run_tests.py PHOTO_DIR SHOT_DIR` runs headless Chromium (Playwright) end-to-end.
- Debug: `?kids=0` forces the painted art.

Scripture quotations are from the New International Reader's Version® (NIrV®), Copyright © 1995, 1996, 1998, 2014 by Biblica, Inc.® Used by permission. All rights reserved worldwide.
