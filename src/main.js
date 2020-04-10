import Vue from 'vue'
import App from './App.vue'
import Amplify, * as AmplifyModules from 'aws-amplify'
import { AmplifyPlugin } from 'aws-amplify-vue'
import awsconfig from './aws-exports'

// Considering you have an existing aws-exports.js configuration file 
Amplify.configure(awsconfig)

Vue.config.productionTip = false

Vue.use(AmplifyPlugin, AmplifyModules)

new Vue({
  render: h => h(App),
}).$mount('#app')
