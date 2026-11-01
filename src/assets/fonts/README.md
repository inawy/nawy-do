# Cairo (self-hosted)

- Source: google/fonts `ofl/cairo/Cairo[slnt,wght].ttf` (SIL OFL 1.1, see OFL.txt).
- Derived file: `cairo-arabic-latin.woff` — `slnt` axis pinned to 0, subset to Latin + Arabic blocks
  (U+0020-007E, 00A0-00FF, 0600-06FF, 0750-077F, 08A0-08FF, 2000-206F, 20AC, 2190-2193, FB50-FDFF, FE70-FEFF),
  all layout features kept, weight axis 200-1000 preserved (variable).
- Regenerate: fontTools `instancer` (slnt=0) then `pyftsubset --flavor=woff`.
- Format is WOFF (zlib) because brotli was unavailable when generated; WOFF2 would be smaller.
