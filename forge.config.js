import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives'

export default {
  packagerConfig: {
    asar: true,
    icon: './public/electron-vite.animate.svg'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'AMFNetworkMonitor'
      }
    }
  ],
  plugins: [
    new AutoUnpackNativesPlugin({})
  ]
}
