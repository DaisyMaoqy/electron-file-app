<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { HomeFilled, Document } from '@element-plus/icons-vue'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => route.path)

const menuItems = [
  { path: '/', label: '首页', icon: HomeFilled },
  { path: '/table', label: '表格管理', icon: Document },
]

const handleSelect = (path: string) => {
  router.push(path)
}
</script>

<template>
  <el-menu
    :default-active="activeMenu"
    class="sidebar-menu"
    background-color="#304156"
    text-color="#bfcbd9"
    active-text-color="#409EFF"
    @select="handleSelect"
  >
    <div class="sidebar-logo">
      <span class="logo-text">数据分析台</span>
    </div>
    <el-menu-item
      v-for="item in menuItems"
      :key="item.path"
      :index="item.path"
    >
      <el-icon><component :is="item.icon" /></el-icon>
      <span>{{ item.label }}</span>
    </el-menu-item>
  </el-menu>
</template>

<style scoped>
.sidebar-menu {
  height: 100%;
  border-right: none;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 2px;
}
</style>
