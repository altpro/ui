import Vue from 'vue';
import App from './App.vue';
import router from './router';
import Ui from '../index';

Vue.config.productionTip = false;

Vue.use(Ui);

/* eslint-disable no-new */
new Vue({
    el: '#app',
    router,
    render: h => h(App)
})


