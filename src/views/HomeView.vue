<script setup lang="ts">
import { ref } from 'vue'
import vueLogo from '../assets/vue.svg' 

const count = ref(0)

const handleClick = () => {
  alert('按钮被点击了！')
}
</script>

<template>
  <div class="home-container">
    <div>
    <a href="https://electron-vite.github.io" target="_blank">
      <img src="/electron-vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img :src="vueLogo" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <h1>Vite + Vue</h1>

    <div class="card">
      <el-button type="primary" @click="handleClick">点击弹出提示</el-button>
      <el-button type="success" @click="count++">count is {{ count }}</el-button>
      <p>
        Edit
        <code>views/HomeView.vue</code> to test HMR
      </p>
    </div>

    <p>
      Check out
      <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank">create-vue</a>, the official Vue + Vite starter
    </p>
    <p>
      Install
      <a href="https://github.com/vuejs/language-tools" target="_blank">Volar</a>
      in your IDE for a better DX
    </p>
    <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
  </div>
</template>

<style scoped>
.home-container {
  padding: 24px;
}

.home-container h1 {
  font-size: 2.4em;
  line-height: 1.1;
  margin-bottom: 16px;
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}
</style>
