import './polyfills/polyfills';
import Vue from 'vue';
import App from './App.vue';
import router from './router';

Vue.config.productionTip = false;

import Context from './components/Context.vue';
Vue.component('UiContext', Context);

import Data from './components/Data.vue';
Vue.component('UiData', Data);

import Date from './components/Date.vue';
Vue.component('UiDate', Date);

import Dialog from './components/Dialog.vue';
Vue.component('UiDialog', Dialog);

import Drawer from './components/Drawer.vue';
Vue.component('UiDrawer', Drawer);

import Dropdown from './components/Dropdown.vue';
Vue.component('UiDropdown', Dropdown);

import Field from './components/Field.vue';
Vue.component('UiField', Field);

import Notification from './components/Notification.vue';
Vue.component('UiNotification', Notification);

import Pagination from './components/Pagination.vue';
Vue.component('UiPagination', Pagination);

import Ripple from './components/Ripple.vue';
Vue.component('UiRipple', Ripple);

import Select from './components/Select.vue';
Vue.component('UiSelect', Select);

import SelectMultiple from './components/SelectMultiple.vue';
Vue.component('UiSelectMultiple', SelectMultiple);

import Tabs from './components/Tabs.vue';
Vue.component('UiTabs', Tabs);

import Toggle from './components/Toggle.vue';
Vue.component('UiToggle', Toggle);

import Time from './components/Time.vue';
Vue.component('UiTime', Time);

import Wysiwyg from './components/Wysiwyg.vue';
Vue.component('UiWysiwyg', Wysiwyg);


/* eslint-disable no-new */
new Vue({
    el: '#app',
    router,
    render: h => h(App)
})


