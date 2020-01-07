import Vue from 'vue'
import VueRouter from 'vue-router'
import routes from './routes'
import App from './app'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'hash',
  base: __dirname,
  routes
})

new Vue({
  ...App,
  router
}).$mount('#app')
