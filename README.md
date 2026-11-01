# Box Generator

**English** · [Castellano](README.es.md)

A browser-based generator of organizer boxes for 3D printing. Set the size, split it into compartments, pick a lid and download STL files ready for your slicer. Everything prints without supports.

**Use it here: <https://elemilio.github.io/stlboxes/>**

It's a single `index.html` with no build step and no server: open it in a browser and you're done.

## What you can do

- **Size** given as outside or inside dimensions, with rounded corners, wall and floor thickness.
- **Compartments** in rows and columns, equal or with relative widths and depths (for example `1,2,1`).
- **Lid**
  - *Slip-on*: fits over the outside of the box, like a shoebox, with the clearance you choose.
  - *Hinged*: alternating knuckles on box and lid; assemble it by pushing through a piece of 1.75 mm filament, a 2 mm rod or an M3 screw.
  - No lid: just leave the section switched off.
- **Closures**
  - *Snap* (slip-on lid): a bead around the box and another inside the lid rim.
  - *Magnets* (both lids): corner posts with pockets for disc magnets and matching pockets in the lid.
  - *Latch* (hinged lid): a flexible tab on the front that catches the lid.
- **Text and emojis** on the lid and on any of the four sides (handy when stacking boxes), embossed or engraved. Emojis come out as silhouettes with their dark parts hollow.
- **Print warnings**: walls with partial perimeters, odd clearances, parts that don't fit your bed, and so on.
- **3D view** of the box, the lid or both together, with a slider to open the hinge or lift the slip-on lid.
- **Minimal interface**: compartments, lid, text and printer are switched on with a toggle; when off they take no space.
- **Dark mode**: follows your system, or pick it with the button in the top bar.
- **English and Spanish**, with a selector in the top bar (the first time it follows the browser language).
- **My designs**: save your boxes by name in the browser and reopen them to keep editing. To take them to another device, copy the link (or the code, inside the claude.ai viewer) or export the `.json`.

The download is one STL per part (box and lid). Published as a claude.ai artifact, the download is a `.zip` with both STLs and the design `.json`, because that viewer only allows certain file extensions.

## Usage

Open `index.html` in a modern browser. It needs a connection to load three.js and earcut from a CDN, and the Google Fonts.

To serve it locally:

```bash
python3 -m http.server 8771
```

and open <http://localhost:8771>.

## Printing tips

- With a 0.4 mm nozzle, 1.2 or 1.6 mm walls (3 or 4 perimeters) print clean.
- Print box and lid separately, each with its large face on the bed.
- The slip-on lid prints upside down, so its text is engraved, mirrored, on the face touching the bed: it reads correctly once flipped.
- For embossed text on the hinged lid in a different color, change filament at the height the app shows.
- Glue the magnets with superglue and check they attract each other before it sets.

## How it's built

All the geometry code sits between `// ==CORE-START==` and `// ==CORE-END==` in `index.html`: pure functions with no DOM, in millimeters, with Z pointing up. Each part is generated as a single closed mesh (rounded outlines, faces triangulated with earcut and extruded walls). Text is drawn on a canvas, turned into a mask, its outlines are traced and extruded onto the chosen face.

## Tests

They need Node 18 or later:

```bash
cd tests && npm i earcut@2.2.4 && node test.mjs && node hinge-test.mjs
```

- `test.mjs` generates STLs for many configurations (lids, closures, text) and checks the volume and that every part is a closed solid, using `check-stl.mjs`. It also checks saved designs and that every message is translated into English.
- `hinge-test.mjs` checks in 2D that the hinged lid swings from 0 to 125° without hitting the box.
