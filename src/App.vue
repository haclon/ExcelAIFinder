<template>
  <div id="app">
    <ExcelContentFinder />
  </div>
</template>

<script>
import ExcelContentFinder from './components/ExcelContentFinder.vue'

export default {
  name: 'App',
  components: {
    ExcelContentFinder
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}
</style> 