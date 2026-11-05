// 应用入口：Element Plus 组件逻辑按需加载，基础样式统一加载，
// 避免开发环境首次进入懒加载菜单时重新优化样式依赖并中断路由跳转。
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import './styles/index.less'
import App from './App.vue'
import router from './router'

createApp(App)
  .use(createPinia())
  .use(router)
  .mount('#app')
