# Icons — Google Material Symbols (Outlined)

Source: <https://github.com/google/material-design-icons> at commit `10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7`, files `symbols/web/<name>/materialsymbolsoutlined/<name>_24px.svg` (and `star_fill1_24px.svg` for the selected star), copied **unmodified** and named by their original symbol names. License: Apache License 2.0 (`LICENSE` here). See `inawy/design-system` → `components/README.md#icon-system`.

| File                         | Used for                                               |
| ---------------------------- | ------------------------------------------------------ |
| `add.svg`                    | add a task / new list                                  |
| `star.svg`, `star_fill1.svg` | favourite (outline / selected) and the favourites view |
| `task_alt.svg`               | «نواياي» (all tasks)                                   |
| `calendar_month.svg`         | scheduled view                                         |
| `today.svg`                  | «اليوم» (today view)                                   |
| `expand_more.svg`            | collapse chevron (rotated by CSS)                      |
| `delete.svg`                 | delete                                                 |
| `close.svg`                  | close a sheet                                          |
| `drag_indicator.svg`         | re-order handle                                        |
| `format_list_bulleted.svg`   | a list                                                 |
| `more_vert.svg`              | list options                                           |
| `download.svg`               | «بياناتي» (backup)                                     |
| `search.svg`                 | search                                                 |
| `swap_vert.svg`              | sort (the arrows beside the list title)                |
| `menu.svg`                   | the side menu                                          |
| `language.svg`               | language choice in the side menu                       |

Rules (from the design system): only real Material Symbols files, Outlined; no Emoji, no hand-drawn "Material-style" paths, no second icon pack in the same screen. A new icon = copy the file from the source above, add a row here. They are turned into React components by `vite-plugin-svgr` (`?react`) in `ui/primitives/icons.tsx`.
