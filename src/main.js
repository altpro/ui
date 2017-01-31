import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

import routes from './routes';
const router = new VueRouter(routes);

import App from './App.vue';

import Checkbox from './components/Checkbox.vue';
Vue.component('UiCheckbox', Checkbox);

import Collapse from './components/Collapse.vue';
Vue.component('UiCollapse', Collapse);

import Context from './components/Context.vue';
Vue.component('UiContext', Context);

import Date from './components/Date.vue';
Vue.component('UiDate', Date);

import Dialog from './components/Dialog.vue';
Vue.component('UiDialog', Dialog);

import Dropdown from './components/Dropdown.vue';
Vue.component('UiDropdown', Dropdown);

import Field from './components/Field.vue';
Vue.component('UiField', Field);

import Input from './components/Input.vue';
Vue.component('UiInput', Input);

import Link from './components/Link.vue';
Vue.component('UiLink', Link);

import Notification from './components/Notification.vue';
Vue.component('UiNotification', Notification);

import Ripple from './components/Ripple.vue';
Vue.component('UiRipple', Ripple);

import Select from './components/Select.vue';
Vue.component('UiSelect', Select);

import SelectMultiple from './components/SelectMultiple.vue';
Vue.component('UiSelectMultiple', SelectMultiple);

import Switch from './components/Switch.vue';
Vue.component('UiSwitch', Switch);

import Tabs from './components/Tabs.vue';
Vue.component('UiTabs', Tabs);

import Textarea from './components/Textarea.vue';
Vue.component('UiTextarea', Textarea);

import Time from './components/Time.vue';
Vue.component('UiTime', Time);

import Wysiwyg from './components/Wysiwyg.vue';
Vue.component('UiWysiwyg', Wysiwyg);


/* eslint-disable no-new */
new Vue({
    router,
    el: '#app',
    render: h => h(App)
})
