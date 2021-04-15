import {
  ref,
  withCtx,
  computed,
  onMounted,
  ComputedRef,
  KeepAlive,
  openBlock,
  createBlock,
  createVNode,
  SetupContext,
  defineComponent,
  resolveComponent,
  ConcreteComponent,
  resolveDynamicComponent,
} from 'vue'

import { RouterView, useRoute } from 'vue-router'

import { useTabBar } from '../../plugin/state'
import { useKeepAliveRoute } from '../../plugin/page'

import TabBar from './tabBar'

type KeepAliveRoute = ReturnType<typeof useKeepAliveRoute>

const CSS_VARS = [
  '--status-bar-height',
  '--top-window-height',
  '--window-left',
  '--window-right',
  '--window-margin',
  '--tab-bar-height',
]

export default defineComponent({
  name: 'Layout',
  setup(_props, { emit }) {
    useCssVar()
    const keepAliveRoute = (__UNI_FEATURE_PAGES__ &&
      useKeepAliveRoute()) as KeepAliveRoute
    const topWindow = __UNI_FEATURE_TOPWINDOW__ && useTopWindow()
    const leftWindow = __UNI_FEATURE_LEFTWINDOW__ && useLeftWindow()
    const rightWindow = __UNI_FEATURE_RIGHTWINDOW__ && useRightWindow()
    const showTabBar = (__UNI_FEATURE_TABBAR__ &&
      useShowTabBar(emit)) as ComputedRef<boolean>
    const clazz = useAppClass(showTabBar)
    return () => {
      const layoutTsx = createLayoutTsx(
        keepAliveRoute,
        topWindow,
        leftWindow,
        rightWindow
      )
      const tabBarTsx = __UNI_FEATURE_TABBAR__ && createTabBarTsx(showTabBar)
      return <uni-app class={clazz.value}>{[layoutTsx, tabBarTsx]}</uni-app>
    }
  },
})
import { updateCssVar } from '../../../helpers/dom'

function useCssVar() {
  CSS_VARS.forEach((name) => updateCssVar(name, '0px'))
}

function useAppClass(showTabBar?: ComputedRef<boolean>) {
  const showMaxWidth = ref(false)
  return computed(() => {
    return {
      'uni-app--showtabbar': showTabBar && showTabBar.value,
      'uni-app--maxwidth': showMaxWidth.value,
    }
  })
}

function createLayoutTsx(
  keepAliveRoute: KeepAliveRoute,
  topWindow?: unknown,
  leftWindow?: unknown,
  rightWindow?: unknown
) {
  const routerVNode = __UNI_FEATURE_PAGES__
    ? createRouterViewVNode(keepAliveRoute)
    : createPageVNode()
  // 非响应式
  if (!__UNI_FEATURE_RESPONSIVE__) {
    return routerVNode
  }
  const topWindowTsx = __UNI_FEATURE_TOPWINDOW__
    ? createTopWindowTsx(topWindow)
    : null
  const leftWindowTsx = __UNI_FEATURE_LEFTWINDOW__
    ? createLeftWindowTsx(leftWindow)
    : null
  const rightWindowTsx = __UNI_FEATURE_RIGHTWINDOW__
    ? createRightWindowTsx(rightWindow)
    : null
  return (
    <uni-layout>
      {topWindowTsx}
      <uni-content>
        <uni-main>{routerVNode}</uni-main>
        {leftWindowTsx}
        {rightWindowTsx}
      </uni-content>
    </uni-layout>
  )
}

function useShowTabBar(emit: SetupContext<['change']>['emit']) {
  const route = useRoute()
  const tabBar = useTabBar()!
  // TODO meida query
  const showTabBar = computed(() => route.meta.isTabBar && tabBar.shown)
  updateCssVar('--tab-bar-height', tabBar.height!)
  return showTabBar
}

function createTabBarTsx(showTabBar: ComputedRef<boolean>) {
  return <TabBar v-show={showTabBar.value} />
}

function createPageVNode() {
  return createVNode(__uniRoutes[0].component)
}

function createRouterViewVNode(
  keepAliveRoute: ReturnType<typeof useKeepAliveRoute>
) {
  return createVNode(RouterView, null, {
    default: withCtx(({ Component }: { Component: unknown }) => [
      (openBlock(),
      createBlock(
        KeepAlive,
        { matchBy: 'key', cache: keepAliveRoute.routeCache },
        [
          (openBlock(),
          createBlock(resolveDynamicComponent(Component), {
            key: keepAliveRoute.routeKey.value,
          })),
        ],
        1032 /* PROPS, DYNAMIC_SLOTS */,
        ['cache']
      )),
    ]),
    _: 1 /* STABLE */,
  })
}

function useTopWindow() {
  const component = resolveComponent('VUniTopWindow') as ConcreteComponent
  return {
    component,
    style: (component as any).style,
    height: 0,
    show: false,
  }
}
function useLeftWindow() {
  const component = resolveComponent('VUniLeftWindow') as ConcreteComponent
  return {
    component,
    style: (component as any).style,
    height: 0,
  }
}
function useRightWindow() {
  const component = resolveComponent('VUniRightWindow') as ConcreteComponent
  return {
    component,
    style: (component as any).style,
    height: 0,
  }
}

function createTopWindowTsx(topWindow: unknown) {}
function createLeftWindowTsx(leftWindow: unknown) {}
function createRightWindowTsx(leftWindow: unknown) {}
