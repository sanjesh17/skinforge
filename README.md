# skinforge

Terminal skins for Claude Code. Each skin is a color theme plus its own prompt banner, spinner animation and finish sound, and the extras switch on and off with the theme you pick in `/theme`.

## Skins

| Skin | Banner | Spinner | Sound |
| --- | --- | --- | --- |
| Cyberpunk Neon | ASCII `NEON` logo | neon colors, glitchy letters | chiptune arpeggio |
| Catppuccin Latte, Frappé, Macchiato, Mocha | ASCII cat | the flavor's pastel palette | soft chime |

Any other theme keeps Claude Code's normal spinner and prompt.

## Install

```
/plugin install skinforge --marketplace sanjesh17/skinforge
```

Then pick a skin with `/theme`. Themes load when a session starts, so restart after installing.

## The /skin command

```
/skin glitch|scan|pulse   spinner preset
/skin band on|off         prompt banner
/skin sound on|off        finish sound
```

Settings last for the session. The default preset is `glitch`.

## Adding a skin

1. Add a theme file to `themes/` (see the existing ones for the token list).
2. Add an entry to `SKINS` in `hooks/register.tsx`: a pattern that matches the theme name, a palette, a banner, a sound and a pulse glyph set.

## Notes

The theme files use the plugin `themes` key, which is marked experimental and may change. The spinner, banner and sound are Claude Code mod hooks and need a version with mod support. The finish sound uses `afplay`, so it plays on macOS only.
