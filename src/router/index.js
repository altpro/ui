import Vue from 'vue';
import Router from 'vue-router';

import Index from '@/docs/Index.vue';
import NotFound from '@/docs/NotFound.vue';

import Badges from '@/docs/Badges.vue';
import Buttons from '@/docs/Buttons.vue';
import Cards from '@/docs/Cards.vue';
import Data from '@/docs/Data.vue';
import Date from '@/docs/Date.vue';
import Details from '@/docs/Details.vue';
import Dialogs from '@/docs/Dialogs.vue';
import Drawer from '@/docs/Drawer.vue';
import Dropdowns from '@/docs/Dropdowns.vue';
import Forms from '@/docs/Forms.vue';
import Lists from '@/docs/Lists.vue';
import Notifications from '@/docs/Notifications.vue';
import Pagination from '@/docs/Pagination.vue';
import Tables from '@/docs/Tables.vue';
import Tabs from '@/docs/Tabs.vue';
import Tooltips from '@/docs/Tooltips.vue';

Vue.use(Router);

export default new Router({
    routes: [
        { path: '/', component: Index, name: 'home' },
        { path: '/badges', component: Badges, name: 'badges' },
        { path: '/buttons', component: Buttons, name: 'buttons' },
        { path: '/cards', component: Cards, name: 'cards' },
        { path: '/data', component: Data, name: 'data' },
        { path: '/date', component: Date, name: 'date' },
        { path: '/details', component: Details, name: 'details' },
        { path: '/dialogs', component: Dialogs, name: 'dialogs' },
        { path: '/drawer', component: Drawer, name: 'drawer' },
        { path: '/dropdowns', component: Dropdowns, name: 'dropdowns' },
        { path: '/forms', component: Forms, name: 'forms' },
        { path: '/lists', component: Lists, name: 'lists' },
        { path: '/notifications', component: Notifications, name: 'notifications' },
        { path: '/pagination', component: Pagination, name: 'pagination' },
        { path: '/tables', component: Tables, name: 'tables' },
        { path: '/tabs', component: Tabs, name: 'tabs' },
        { path: '/tooltips', component: Tooltips, name: 'tooltips' },
        { path: '*', component: NotFound, name: '404' }
    ],
    mode: 'history',
    linkActiveClass: 'active'
});