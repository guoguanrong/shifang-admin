import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: false })],
    }),
  ],
  // Element Plus 组件逻辑仍按需加载；公共样式由 main.js 一次性引入。
  // 预构建核心入口，避免首次打开懒加载菜单时二次优化并中断路由请求。
  optimizeDeps: {
    include: [
      'element-plus',
      '@element-plus/icons-vue',
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    // 开发环境跨域代理：/api 转发到 api2 网关；后端接口本身带 /api 前缀，因此不做 rewrite。
    proxy: {
      '/api': {
        target: 'https://api2.shifangtemple.org',
        changeOrigin: true,
      },
    },
  },
})
