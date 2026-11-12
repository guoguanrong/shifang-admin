<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import {
  Avatar,
  Calendar,
  Clock,
  DataBoard,
  Document,
  EditPen,
  Flag,
  Goods,
  Key,
  MagicStick,
  Menu,
  Monitor,
  Notification,
  Postcard,
  Present,
  Sunny,
  Ticket,
  Tickets,
  User,
  UserFilled,
  Wallet,
} from '@element-plus/icons-vue'
import { useMenuStore } from '../../stores/menu'
import { isMenuEnabled } from '../../router'

defineProps({
  collapsed: { type: Boolean, default: false },
})

// 菜单 icon 字段 → 图标组件。新增菜单图标时在此登记，未登记时回退到 Menu。
const iconMap = {
  Avatar,
  Calendar,
  Clock,
  DataBoard,
  Document,
  EditPen,
  Flag,
  Goods,
  Key,
  MagicStick,
  Menu,
  Monitor,
  Notification,
  Postcard,
  Present,
  Sunny,
  Ticket,
  Tickets,
  User,
  UserFilled,
  Wallet,
}
const defaultIcon = Menu

const route = useRoute()
const menuStore = useMenuStore()
const { menuGroups } = storeToRefs(menuStore)

// 菜单高亮：自身路径命中，或命中 activePaths（如详情页归属列表菜单），
// 或由详情路由 meta.activeMenuPath 反向指定所属菜单。
function isMenuActive(item) {
  return route.path === item.path
    || item.activePaths?.includes(route.path)
    || route.meta.activeMenuPath === item.path
}

// 首次进入时加载菜单（store 内部已做防重复加载）。
onMounted(() => menuStore.loadMenuGroups())
</script>

<template>
  <aside :class="['sidebar', { collapsed }]">
    <header class="sidebar-brand">
      <span class="brand-logo" aria-hidden="true">十</span>
      <strong>十方殿管理端</strong>
    </header>

    <!-- 菜单由 menu store 提供，按 group 分组渲染，每项是一个路由链接 -->
    <nav class="sidebar-nav" aria-label="后台主导航">
      <section v-for="group in menuGroups" :key="group.title" class="menu-group">
        <h2>{{ group.title }}</h2>
        <RouterLink
          v-for="item in group.children"
          :key="item.id"
          :to="item.path"
          :class="['menu-item', { active: isMenuActive(item), 'menu-locked': !isMenuEnabled(item.id) }]"
          :title="collapsed ? item.title : undefined"
          :aria-label="collapsed ? item.title : undefined"
        >
          <el-icon class="menu-icon" :size="15">
            <component :is="iconMap[item.icon] || defaultIcon" />
          </el-icon>
          <span class="menu-title">{{ item.title }}</span>
        </RouterLink>
      </section>
    </nav>
  </aside>
</template>

<style scoped lang="less">
.sidebar {
  position: fixed;
  z-index: 20;
  inset: 0 auto 0 0;
  width: var(--admin-sidebar-width);
  color: var(--admin-text-primary);
  background: var(--admin-surface);
  border-right: 1px solid var(--admin-border-light);
  box-shadow: var(--admin-shadow-sidebar);
  transition: width 0.2s ease;

  &.collapsed {
    width: 64px;

    .sidebar-brand {
      justify-content: center;
      padding: 0;

      strong {
        display: none;
      }
    }

    .menu-group h2,
    .menu-title {
      display: none;
    }

    .menu-group h2 {
      padding: 0;
    }

    .menu-item {
      justify-content: center;
      padding: 0;
    }
  }
}

.sidebar-brand {
  height: var(--admin-topbar-height);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 15px;
  border-bottom: 1px solid var(--admin-border-light);

  strong {
    color: var(--admin-brand);
    font-size: 18px;
    font-weight: 700;
    white-space: nowrap;
  }
}

.brand-logo {
  width: 30px;
  height: 30px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: var(--admin-text-inverse);
  font-size: 17px;
  font-weight: 700;
  background: var(--admin-brand-gradient);
  border-radius: var(--admin-radius-lg) var(--admin-radius-lg) var(--admin-radius-lg) 2px;
}

.sidebar-nav {
  height: calc(100vh - var(--admin-topbar-height));
  padding: 12px 0 28px;
  overflow-y: auto;
  scrollbar-color: var(--admin-border-strong) transparent;
  scrollbar-width: thin;
}

.menu-group {
  margin: 0 0 7px;

  h2 {
    margin: 0;
    padding: 7px 20px 5px;
    color: var(--admin-text-muted);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1px;
  }
}

.menu-item {
  position: relative;
  width: 100%;
  height: 42px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 22px;
  color: var(--admin-text-regular);
  font-size: 14px;
  text-align: left;
  text-decoration: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  border-left: 4px solid transparent;
  transition: color 0.18s ease, background 0.18s ease, border-color 0.18s ease;

  &:hover {
    color: var(--admin-primary);
    background: var(--admin-primary-lighter);
  }

  &.active {
    color: var(--admin-primary);
    font-weight: 600;
    background: var(--admin-primary-light);
    border-left-color: var(--admin-primary);
  }

  // 本期未开放模块：整体置灰，点击时由路由守卫弹窗提示。
  &.menu-locked {
    opacity: .5;

    &:hover {
      color: var(--admin-text-secondary);
      background: transparent;
    }

    .menu-icon {
      color: var(--admin-text-secondary);
    }
  }
}

.menu-icon {
  flex: 0 0 auto;
  color: var(--admin-text-secondary);
  transition: color 0.18s ease;
}

.menu-item:hover .menu-icon,
.menu-item.active .menu-icon {
  color: var(--admin-primary);
}

.menu-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 菜单与内容卡片采用同一套柔和的圆角和主色强调。
.sidebar-brand {
  padding: 0 18px;
  background: linear-gradient(120deg, var(--admin-surface), var(--admin-primary-lighter));
}

.brand-logo { box-shadow: 0 5px 13px rgba(47, 156, 143, 0.18); }

.sidebar-nav { padding-top: 16px; }

.menu-group {
  margin-bottom: 12px;

  h2 { padding: 9px 22px 6px; font-weight: 600; letter-spacing: 1.3px; }
}

.menu-item {
  width: calc(100% - 20px);
  height: 40px;
  margin: 2px 10px;
  padding: 0 13px;
  border-left: 0;
  border-radius: 9px;

  &.active {
    background: var(--admin-primary-light);

    &::before {
      position: absolute;
      top: 11px;
      bottom: 11px;
      left: 0;
      width: 3px;
      content: '';
      background: var(--admin-primary);
      border-radius: var(--admin-radius-pill);
    }
  }
}

.sidebar.collapsed .menu-item {
  width: 52px;
  margin: 2px 6px;
}
</style>
