import { createApp } from './main'
import { renderToString } from '@vue/server-renderer'
import {
  UNI_SSR,
  UNI_SSR_DATA,
  UNI_SSR_STORE,
  UNI_SSR_GLOBAL_DATA,
} from '@dcloudio/uni-shared'
import { plugin } from '@dcloudio/uni-h5'
import { getSsrGlobalData } from '@dcloudio/uni-app'

export async function render(url, manifest = {}) {
  const { app, store } = createApp()
  app.use(plugin)
  const router = app.router

  // set the router to the desired URL before rendering
  await router.push(url)
  await router.isReady()

  // passing SSR context object which will be available via useSSRContext()
  // @vitejs/plugin-vue injects code into a component's setup() that registers
  // itself on ctx.modules. After the render, ctx.modules would contain all the
  // components that have been instantiated during this render call.
  const ctx = {}
  const html = await renderToString(app, ctx)

  // the SSR manifest generated by Vite contains module -> chunk/asset mapping
  // which we can then use to determine what files need to be preloaded for this
  // request.
  const preloadLinks = renderPreloadLinks(ctx.modules, manifest)
  // the SSR context
  const __uniSSR = ctx[UNI_SSR] || (ctx[UNI_SSR] = {})
  if (!__uniSSR[UNI_SSR_DATA]) {
    __uniSSR[UNI_SSR_DATA] = {}
  }
  __uniSSR[UNI_SSR_GLOBAL_DATA] = getSsrGlobalData()
  if (store) {
    __uniSSR[UNI_SSR_STORE] = store.state
  }
  const appContext = renderAppContext(ctx)
  return [html, preloadLinks, appContext]
}

function renderPreloadLinks(modules, manifest) {
  let links = ''
  const seen = new Set()
  modules.forEach((id) => {
    const files = manifest[id]
    if (files) {
      files.forEach((file) => {
        if (!seen.has(file)) {
          seen.add(file)
          links += renderPreloadLink(file)
        }
      })
    }
  })
  return links
}

function renderPreloadLink(file) {
  if (file.endsWith('.js')) {
    return '<link rel="modulepreload" crossorigin href="' + file + '">'
  } else if (file.endsWith('.css')) {
    return '<link rel="stylesheet" href="' + file + '">'
  } else {
    // TODO
    return ''
  }
}

function renderAppContext(ctx) {
  return `<script>window.__uniSSR = ${JSON.stringify(ctx[UNI_SSR])}</script>`
}
