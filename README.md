# 十方殿管理端

十方殿官方网站的后台管理系统：菜单驱动的路由与权限、数据看板、用户/义工/捐赠/订单/活动等内容管理。基于 Vue 3 + Element Plus + Pinia + Vite 构建，当前数据来自本地 mock，已预留后端接入点。

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Vue 3（`<script setup>` 组合式 API） |
| 路由 | Vue Router 5（HTML5 History 模式） |
| 状态管理 | Pinia 4（setup store 写法） |
| UI | Element Plus 2 + `@element-plus/icons-vue`（`unplugin-vue-components` 按需引入） |
| 图表 | ECharts 6 + vue-echarts 8（按需注册组件） |
| HTTP | Axios（`src/services/http.js` 统一实例） |
| 构建 | Vite 8，样式预处理器 Less 4 |

## 快速开始

```bash
npm install        # 安装依赖
npm run dev        # 开发服务器 http://localhost:5174（监听 0.0.0.0）
npm run build      # 生产构建，产物输出到 dist/
npm run preview    # 预览构建产物
```

演示账号：`admin` / `123456`（校验逻辑在 `stores/auth.js`，为延时模拟的演示实现）。

接口地址：复制 `.env.example` 为 `.env.local`，修改 `VITE_API_BASE_URL`（缺省 `/api`）。

## 功能与路由

业务路由由菜单数据生成（`router/index.js` 的 `buildMenuRoutes`），菜单项未登记组件时统一回退到 `PlaceholderView`。

| 分组 | 路径 | 页面 |
|------|------|------|
| 总览 | `/dashboard` | 数据看板（指标卡、折线图、环形图、捐赠目标、待办） |
| 用户管理 | `/users` | 用户列表 |
| 义工管理 | `/volunteers/applications` | 申请列表（审核） |
| 义工管理 | `/volunteers` | 义工列表 |
| 捐赠管理 | `/donations/records` | 捐赠记录 |
| 捐赠管理 | `/donations/goals` | 捐赠目标 |
| 捐赠管理 | `/donations/items` | 物品列表 |
| 业务管理 | `/business/lamps` | 线上点灯 |
| 业务管理 | `/business/deity-offerings` | 神像供奉 |
| 订单管理 | `/orders/lamps` | 点灯订单 |
| 订单管理 | `/orders/offerings` | 供奉订单 |
| 活动管理 | `/activities` | 活动列表 |
| 活动管理 | `/activities/registrations` | 报名记录 |
| 信众实录 | `/believer-records` | 实录列表 |
| 各界寄语 | `/messages` | 寄语列表 |
| 动态管理 | `/news` | 动态列表 |
| 道法养生 | `/wellness/videos` | 跟练视频 |
| 道法养生 | `/wellness/classics` | 道典精读 |
| 资金公示 | `/funds/supervision` | 云监工 |
| 资金公示 | `/funds/expenses` | 善款支出 |
| 权限管理 | `/permissions/accounts`、`/permissions/roles` | 账号管理、角色权限（前端 mock 交互，数据在页面刷新后恢复） |
| 系统管理 | `/system/logs` | 操作日志 |
| — | `/login` | 登录页（公开路由） |

未知路径重定向到 `/dashboard`；未登录访问受保护页面会跳登录并带上 `redirect` 回跳参数。

## 目录结构

```
shifang-admin/
├── .env.example                 # VITE_API_BASE_URL 示例
├── vite.config.js               # Element Plus 按需引入、依赖预构建、端口 5174
└── src/
    ├── components/
    │   ├── layout/              # AdminLayout（顶栏+侧栏+面包屑+页签）、AppSidebar
    │   ├── dashboard/           # 看板卡片、面板、时间范围、charts/（ECharts 封装）
    │   ├── activity/ donation/ order/ fund/ user/ volunteer/ message/ news/
    │   │   record/ online/ deity/ wellness/ log/   # 各业务的筛选条与表格
    │   └── common/               # 通用操作链接
    ├── constants/listFilters.js  # 各列表页筛选条件的初始值工厂
    ├── mock/                     # 演示数据（含 menus.js 菜单结构）
    ├── router/index.js           # 路由表、菜单→路由转换、登录守卫
    ├── services/
    │   ├── http.js               # axios 实例：token 注入、401 处理
    │   └── dataSource.js         # 数据适配层：页面只读这一层，便于替换后端
    ├── stores/                   # auth（会话）、menu（菜单/路由）、tabs（页签）
    ├── styles/                   # variables / theme / element / index（Less）
    ├── utils/csv.js              # CSV 导出（BOM、转义、公式注入防护）
    ├── views/                    # 23 个页面组件
    ├── App.vue
    └── main.js
```

## 关键设计说明

**菜单驱动路由**：`mock/menus.js`（或后端返回的同构数据）经 `buildMenuRoutes` 摊平为路由，挂载在 `AdminLayout` 下；`replaceMenuRoutes` 可用后端菜单整体替换已有路由，避免用户仍能访问已无权限的页面。菜单结构字段说明见 `mock/menus.js` 头部注释。

**登录与鉴权**：会话写入 `localStorage` 或 `sessionStorage`（key `shifang-admin-session`，勾选「记住」则用 localStorage）。路由守卫据此放行；`http.js` 请求拦截自动带 `Bearer` token，遇到 401 清理会话并跳登录页。

**数据层收敛**：页面只通过 `services/dataSource.js` 的 `getInitialData()` / `getDataOptions()` 取数，当前适配器返回 mock 的深拷贝。接入后端时只需替换这一层（或在 `services/` 下新增 API repository），视图无需感知。

**列表页套路**：`XxxListView` 负责状态与分页，`XxxFilterBar` 抛出 `search`/`reset`，`XxxTable` 抛出 `edit`/`toggle`/`remove`/`page-change`；筛选初始值统一在 `constants/listFilters.js`，分页与筛选在前端完成，导出走 `utils/csv.js`（带 BOM 防中文乱码，并对 `=` `+` `-` `@` 开头的文本加前导单引号防公式注入）。

**看板图表**：`components/dashboard/charts/setup.js` 只注册折线图、饼图与必要组件，`DashboardLineChart` / `DashboardDonutChart` 通过 props 接收数据与纵轴上限；mock 数据按时间范围做系数缩放以模拟不同区间的量级。

**页签与布局**：`stores/tabs.js` 维护多页签（首页常驻不可关，其余持久化到 sessionStorage），侧栏折叠状态存在 localStorage。

**主题**：`styles/variables.less` 是颜色、圆角、阴影、间距等设计令牌的唯一来源，`theme.less` 映射为 `var(--admin-*)` 全局 CSS 变量，`element.less` 负责 Element Plus 主题映射。换色只改 `variables.less`，业务组件统一用 `var(--admin-*)`。

**组件按需引入**：`unplugin-vue-components` + `ElementPlusResolver` 按需加载组件逻辑，基础样式在 `main.js` 一次性引入；`vite.config.js` 预构建 `element-plus` 与图标包，避免首次打开懒加载菜单时二次优化。

## 常见改动

- **新增业务页面**：在 `views/` 建页面 → 在 `router/index.js` 的 `componentMap` 登记 → 在 `mock/menus.js`（或后端菜单）加菜单项 → 需要筛选时在 `constants/listFilters.js` 补初始值工厂 → 菜单图标需在 `AppSidebar` 的 `iconMap` 中登记（未登记回退默认图标）。
- **接入后端**：`services/dataSource.js` 改为请求接口；菜单改为 `menuStore.setMenuGroups(后端菜单)`；`stores/auth.js` 的 `login` 换成真实登录接口（会话写入部分可保留）。
- **调整演示数据**：改 `src/mock/` 下对应文件即可，字段含义写在各文件头部注释里。

## 部署

```bash
npm run build   # 产出 dist/
```

使用 HTML5 History 模式，服务端需把未匹配的路径回退到 `index.html`；站点子路径部署由 `import.meta.env.BASE_URL` 决定，无需硬编码 base。
