import './src/polyfills/polyfills';

import Context from './src/components/Context.vue';
import Data from './src/components/Data.vue';
import Date from './src/components/Date.vue';
import Dialog from './src/components/Dialog.vue';
import Drawer from './src/components/Drawer.vue';
import Dropdown from './src/components/Dropdown.vue';
import Field from './src/components/Field.vue';
import Form from './src/components/Form.vue';
import Loader from './src/components/Loader.vue';
import Notification from './src/components/Notification.vue';
import Pagination from './src/components/Pagination.vue';
import Select from './src/components/Select.vue';
import SelectMultiple from './src/components/SelectMultiple.vue';
import Tabs from './src/components/Tabs.vue';
import Toggle from './src/components/Toggle.vue';

const Ui = {
    Context,
    Data,
    Date,
    Dialog,
    Drawer,
    Dropdown,
    Field,
    Form,
    Loader,
    Notification,
    Pagination,
    Select,
    SelectMultiple,
    Tabs,
    Toggle,

    install: function(Vue) {
        Vue.component('UiContext', Context);
        Vue.component('UiData', Data);
        Vue.component('UiDate', Date);
        Vue.component('UiDialog', Dialog);
        Vue.component('UiDrawer', Drawer);
        Vue.component('UiDropdown', Dropdown);
        Vue.component('UiField', Field);
        Vue.component('UiForm', Form);
        Vue.component('UiLoader', Loader);
        Vue.component('UiNotification', Notification);
        Vue.component('UiPagination', Pagination);
        Vue.component('UiSelect', Select);
        Vue.component('UiSelectMultiple', SelectMultiple);
        Vue.component('UiTabs', Tabs);
        Vue.component('UiToggle', Toggle);
    }
};

export default Ui;

export { Context };
export { Data };
export { Date };
export { Dialog };
export { Drawer };
export { Dropdown };
export { Field };
export { Form };
export { Loader };
export { Notification };
export { Pagination };
export { Select };
export { SelectMultiple };
export { Tabs };
export { Toggle };