<!-- VIBE:BEGIN -->
> [!IMPORTANT]
> This project is connected to AI Studio. Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on AI Studio's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to AI Studio and show up in
> the editor, so keep the branch in a working state.

## Design rules

- **No glowing effects or drop shadows on buttons.** Do not apply outer glows
  (e.g. `shadow-cyan-500/20`, `shadow-xl`, `shadow-2xl`), colored shadow tints,
  or `drop-shadow-*` utilities to buttons or button-like elements. A flat
  gradient fill (e.g. `bg-gradient-to-r from-cyan-500 to-blue-600`) is fine, but
  never add an outer glow or shadow around it. Keep buttons flat and clean.
<!-- VIBE:END -->
