export type Preset = 'glitch' | 'scan' | 'pulse'

declare module 'claude-code' {
  interface PluginState {
    'skinforge': {
      frame: number
      preset: Preset
      isBandOn: boolean
      isSoundOn: boolean
      theme: string
      spinnerText: string
    }
  }
}
