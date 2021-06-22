import path from 'path'
import slash from 'slash'
import debug from 'debug'
import { Plugin } from 'vite'
import { parseVueRequest } from '@dcloudio/uni-cli-shared'

const debugSetup = debug('vite:uni:setup')

export function uniSetupPlugin(): Plugin {
  let appVuePath: string
  return {
    name: 'vite:uni-setup',
    configResolved() {
      appVuePath = slash(path.resolve(process.env.UNI_INPUT_DIR, 'App.vue'))
    },
    transform(code, id) {
      const { filename, query } = parseVueRequest(id)
      if (filename === appVuePath && !query.vue) {
        debugSetup(filename)
        return (
          code +
          `;import { setupApp } from '@dcloudio/uni-h5';setupApp(_sfc_main);`
        )
      }
      if (query.mpType === 'page') {
        debugSetup(filename)
        return (
          code +
          `;import { setupPage } from '@dcloudio/uni-h5';setupPage(_sfc_main);`
        )
      }
    },
  }
}
