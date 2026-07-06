<script setup lang="ts">
import SideBar from './layout/SideBar.vue'
</script>

<template>
  <el-container class="app-container">
    <el-aside width="220px">
      <SideBar />
    </el-aside>
    <el-container>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.app-container {
  height: 100vh;
  width: 100vw;
}

.el-aside {
  background-color: #304156;
  overflow: hidden;
}

.app-main {
  background-color: #f0f2f5;
  padding: 0;
  overflow: auto;
}
</style>
