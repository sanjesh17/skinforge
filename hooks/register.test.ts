import { expect, test } from 'claude-code/testing'

const RUN = {
  command: 'skin',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 80 },
} as const

test('/skin switches the preset and rejects nonsense', async ($, on) => {
  on('command.register', () => ({ value: { command: 'skin' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const scan = await $.command.run({ ...RUN, args: 'scan' })
  expect(scan.text).toContain('scan')

  const band = await $.command.run({ ...RUN, args: 'band off' })
  expect(band.text).toContain('off')

  const bad = await $.command.run({ ...RUN, args: 'nope' })
  expect(bad.text).toContain('Usage')
})
