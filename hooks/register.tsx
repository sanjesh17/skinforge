import { atom, read, update } from 'claude-code'
import type { Elements, Register, Timer } from 'claude-code'

import type { Preset } from '../types'

type Skin = {
  tag: string
  palette: string[]
  logo: string[]
  sound: string
  isGlitchy: boolean
  pulse: string
}

const staticText = {
  unknown: 'Usage: /skin glitch|scan|pulse, /skin band on|off, /skin sound on|off',
  preset: 'Spinner preset: ',
  band: 'Prompt band ',
  sound: 'Finish sound ',
}

const CAT_LOGO = [' /\\_/\\ ', '( o.o )', ' > ^ < ']
const CYBER_LOGO = ['╔╗╔ ╔═╗ ╔═╗ ╔╗╔', '║║║ ║╣  ║ ║ ║║║', '╝╚╝ ╚═╝ ╚═╝ ╝╚╝']
const CYBER: Skin = {
  tag: '//GRID',
  palette: ['#ff2a6d', '#05d9e8', '#f9f002', '#b967ff', '#00ff9f'],
  logo: CYBER_LOGO,
  sound: 'sounds/done.wav',
  isGlitchy: true,
  pulse: '◢◣◤◥',
}
const catppuccin = (tag: string, palette: string[]): Skin => ({
  tag,
  palette,
  logo: CAT_LOGO,
  sound: 'sounds/chime.wav',
  isGlitchy: false,
  pulse: '·•●•',
})

// mauve, pink, sapphire, green, peach, lavender
const SKINS: { match: RegExp; skin: Skin }[] = [
  { match: /cyber/i, skin: CYBER },
  { match: /latte/i, skin: catppuccin('latte', ['#8839ef', '#ea76cb', '#209fb5', '#40a02b', '#fe640b', '#7287fd']) },
  { match: /frapp/i, skin: catppuccin('frappe', ['#ca9ee6', '#f4b8e4', '#85c1dc', '#a6d189', '#ef9f76', '#babbf1']) },
  { match: /macchiato/i, skin: catppuccin('macchiato', ['#c6a0f6', '#f5bde6', '#7dc4e4', '#a6da95', '#f5a97f', '#b7bdf8']) },
  { match: /mocha/i, skin: catppuccin('mocha', ['#cba6f7', '#f5c2e7', '#74c7ec', '#a6e3a1', '#fab387', '#b4befe']) },
]

const GLITCH_CHARS = '▓▒░█▌▐/\\#@%'
const SCAN = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▂']
const PRESETS: Preset[] = ['glitch', 'scan', 'pulse']
const FRAME_MS = 120
const MIN_SOUND_MS = 10_000
const TIME_LENGTH = 8

const frame = atom({ plugin: 'skinforge', key: 'frame' } as const, 0)
const preset = atom({ plugin: 'skinforge', key: 'preset' } as const, 'glitch')
const isBandOn = atom({ plugin: 'skinforge', key: 'isBandOn' } as const, true)
const theme = atom({ plugin: 'skinforge', key: 'theme' } as const, '')
const spinnerText = atom({ plugin: 'skinforge', key: 'spinnerText' } as const, '')
const isSoundOn = atom({ plugin: 'skinforge', key: 'isSoundOn' } as const, true)

const skinFor = (value: string): Skin | null =>
  SKINS.find(({ match }) => match.test(value))?.skin ?? null

const glitchChar = (char: string, i: number, n: number): string =>
  (n * 7 + i * 13) % 23 === 0 && char !== ' '
    ? (GLITCH_CHARS[(n + i) % GLITCH_CHARS.length] ?? char)
    : char

const spinnerTree = (
  { Box, Text }: Pick<Elements['terminal'], 'Box' | 'Text'>,
  skin: Skin,
  n: number,
  style: Preset,
  word: string,
  suffix: string,
) => {
  const { palette } = skin

  if (style === 'scan') {
    const bar = [0, 1, 2].map(i => SCAN[(n + i * 3) % SCAN.length]).join('')
    return (
      <Box>
        <Text color={palette[2]}>{bar} </Text>
        <Text color={palette[0]} bold>{word}</Text>
        <Text color={palette[2]}>{suffix}</Text>
      </Box>
    )
  }

  if (style === 'pulse') {
    const color = palette[Math.floor(n / 4) % palette.length]
    return (
      <Box>
        <Text color={color} bold={n % 8 < 4} dimColor={n % 8 >= 6}>
          {skin.pulse[n % skin.pulse.length]} {word}{suffix}
        </Text>
      </Box>
    )
  }

  return (
    <Box>
      <Text color={palette[1]}>▌</Text>
      {[...word].map((char, i) => (
        <Text color={palette[(i + n) % palette.length]} bold>
          {skin.isGlitchy ? glitchChar(char, i, n) : char}
        </Text>
      ))}
      <Text color={palette[2]}>{suffix}▐</Text>
    </Box>
  )
}

const toggle = (word: string): boolean | null =>
  word === 'on' ? true : word === 'off' ? false : null

export const register: Register = on => {
  let timer: Timer | null = null
  let depth = 0
  let startedAt = 0

  on('session.start', async ($, e, next) => {
    const rows = await $.config.list()
    const current = rows.find(row => row.key === 'theme')
    await update($, theme, () => String(current?.value ?? ''))
    await $.command.register({
      name: 'skin',
      description: 'Theme skin: spinner preset, prompt banner, finish sound',
    })

    return next(e)
  })

  on('config.set', { key: 'theme' }, async ($, e, next) => {
    const result = await next(e)
    await update($, theme, () => String(e.value))

    return result
  })

  on('command.run', { command: 'skin' }, async ($, e) => {
    const [first = '', second = ''] = e.args.trim().toLowerCase().split(/\s+/)
    const flag = toggle(second)

    if (PRESETS.includes(first as Preset)) {
      await update($, preset, () => first as Preset)
      return { text: staticText.preset + first }
    }
    if (first === 'band' && flag !== null) {
      await update($, isBandOn, () => flag)
      return { text: staticText.band + second }
    }
    if (first === 'sound' && flag !== null) {
      await update($, isSoundOn, () => flag)
      return { text: staticText.sound + second }
    }

    return { text: staticText.unknown }
  })

  on('turn.start', async ($, e, next) => {
    if (depth === 0) {
      startedAt = await $.clock.now()
      if (skinFor(await read($, theme))) {
        timer = $.clock.every(FRAME_MS, () => {
          void update($, frame, n => n + 1)
        })
      }
    }
    depth += 1

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    depth = Math.max(0, depth - 1)
    if (depth === 0) {
      timer?.cancel()
      timer = null
      const skin = skinFor(await read($, theme))
      const elapsed = (await $.clock.now()) - startedAt
      if (skin && elapsed >= MIN_SOUND_MS && (await read($, isSoundOn))) {
        void $.audio.play({ asset: skin.sound })
      }
    }

    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const skin = skinFor(await read($, theme))
    if (!skin) {
      return next(e)
    }

    const word = e.props.message ?? e.props.word
    const ui = $.ui.resolve(e)

    if (await read($, isBandOn)) {
      // the banner draws the spinner under itself; keep it current from here
      const text = word + e.props.suffix
      if (text !== (await read($, spinnerText))) {
        void update($, spinnerText, () => text)
      }
      return <ui.Box />
    }

    return spinnerTree(ui, skin, await read($, frame), await read($, preset), word, e.props.suffix)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const skin = skinFor(await read($, theme))
    if (e.props.hasSurvey || !skin || !(await read($, isBandOn))) {
      return next(e)
    }

    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    const n = await read($, frame)
    const time = new Date(await $.clock.now()).toTimeString().slice(0, TIME_LENGTH)
    const style = await read($, preset)
    const info = `  ${skin.tag}  ${time}  ${style}  ${SCAN[n % SCAN.length]}`

    const working = e.props.isWorking
      ? spinnerTree(ui, skin, n, style, await read($, spinnerText), '')
      : null

    return (
      <Box flexDirection="column" paddingTop={1}>
        {skin.logo.map((line, i) => (
          <Text color={skin.palette[(i + Math.floor(n / 3)) % skin.palette.length]} bold>
            {i === 1 ? line + info : line}
          </Text>
        ))}
        {working}
      </Box>
    )
  })
}
