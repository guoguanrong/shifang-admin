<script setup>
import zhCn from 'element-plus/es/locale/lang/zh-cn.mjs'
</script>

<template>
  <el-config-provider :locale="zhCn">
    <!-- 一级路由出口：登录页与后台布局在此整体切换。
         以 matched[0] 作为 key，保证登录/后台这类布局级切换会重新渲染组件。 -->
    <RouterView v-slot="{ Component, route }">
      <Transition name="page-fade" mode="out-in">
        <component :is="Component" :key="route.matched[0]?.name || route.path" />
      </Transition>
    </RouterView>
  </el-config-provider>
</template>
