import { extend } from '@vue/shared'

import { ServiceJSBridge } from '@dcloudio/uni-core'

export const UniServiceJSBridge = /*#__PURE__*/ extend(ServiceJSBridge, {
  publishHandler(event: string, args: any, pageId: number) {
    window.UniViewJSBridge.subscribeHandler(event, args, pageId)
  },
})
