import {
  VNode,
  nextTick,
  computed,
  ConcreteComponent,
  ComponentPublicInstance,
} from 'vue'
import { useRoute, RouteLocationNormalizedLoaded } from 'vue-router'
import { invokeHook } from '@dcloudio/uni-core'
import { removeLeadingSlash } from '@dcloudio/uni-shared'
import { usePageMeta } from './provide'
import { NavigateType } from '../../service/api/route/utils'

const SEP = '$$'

const currentPagesMap = new Map<string, Page.PageInstance>()

function pruneCurrentPages() {
  currentPagesMap.forEach((page, id) => {
    if (((page as unknown) as ComponentPublicInstance).$.isUnmounted) {
      currentPagesMap.delete(id)
    }
  })
}

export function getCurrentPages(isAll: boolean = false) {
  pruneCurrentPages()
  return [...currentPagesMap.values()]
}

export function removeCurrentPages(
  delta: number = 1,
  removeRouteCaches = false
) {
  const keys = [...currentPagesMap.keys()]
  const start = keys.length - 1
  const end = start - delta
  for (let i = start; i > end; i--) {
    const routeKey = keys[i]
    const pageVm = currentPagesMap.get(routeKey) as ComponentPublicInstance
    pageVm.$.__isUnload = true
    invokeHook(pageVm, 'onUnload')
    currentPagesMap.delete(routeKey)
    if (removeRouteCaches) {
      const vnode = pageCacheMap.get(routeKey)
      if (vnode) {
        pageCacheMap.delete(routeKey)
        routeCache.pruneCacheEntry!(vnode)
      }
    }
  }
}

let id = (history.state && history.state.__id__) || 1

export function createPageState(type: NavigateType) {
  return {
    __id__: ++id,
    __type__: type,
  }
}

export function isPage(vm: ComponentPublicInstance) {
  // @dcloudio/vite-plugin-uni/src/configResolved/plugins/pageVue.ts
  return vm.$options.mpType === 'page'
}

function initPublicPage(route: RouteLocationNormalizedLoaded) {
  if (!route) {
    const { path } = __uniRoutes[0]
    return { id, path, route: path.substr(1), fullPath: path }
  }
  const { path } = route
  return {
    id,
    path: path,
    route: removeLeadingSlash(path),
    fullPath: route.meta.isEntry ? route.meta.pagePath : route.fullPath,
    options: {}, // $route.query
    meta: usePageMeta(),
  }
}

export function initPage(vm: ComponentPublicInstance) {
  const route = vm.$route
  const page = initPublicPage(route)
  ;(vm as any).$vm = vm
  ;(vm as any).$page = page
  currentPagesMap.set(
    normalizeRouteKey(page.path, page.id),
    (vm as unknown) as Page.PageInstance
  )
}

function normalizeRouteKey(path: string, id: number) {
  return path + SEP + id
}

export function useKeepAliveRoute() {
  const route = useRoute()
  const routeKey = computed(() =>
    normalizeRouteKey(route.path, history.state.__id__ || 1)
  )
  return {
    routeKey,
    routeCache,
  }
}

// https://github.com/vuejs/rfcs/pull/284
// https://github.com/vuejs/vue-next/pull/3414

type CacheKey = string | number | ConcreteComponent
interface KeepAliveCache {
  get(key: CacheKey): VNode | void
  set(key: CacheKey, value: VNode): void
  delete(key: CacheKey): void
  forEach(
    fn: (value: VNode, key: CacheKey, map: Map<CacheKey, VNode>) => void,
    thisArg?: any
  ): void
  pruneCacheEntry?: (cached: VNode) => void
}
const pageCacheMap = new Map<CacheKey, VNode>()
const routeCache: KeepAliveCache = {
  get(key) {
    return pageCacheMap.get(key)
  },
  set(key, value) {
    pruneRouteCache(key as string)
    pageCacheMap.set(key, value)
  },
  delete(key) {
    const vnode = pageCacheMap.get(key)
    if (!vnode) {
      return
    }
    pageCacheMap.delete(key)
  },
  forEach(fn) {
    pageCacheMap.forEach(fn)
  },
}

function pruneRouteCache(key: string) {
  const pageId = parseInt(key.split(SEP)[1])
  if (!pageId) {
    return
  }
  routeCache.forEach((vnode, key) => {
    const cPageId = parseInt((key as string).split(SEP)[1])
    if (cPageId && cPageId > pageId) {
      routeCache.delete(key)
      routeCache.pruneCacheEntry!(vnode)
      nextTick(() => pruneCurrentPages())
    }
  })
}
