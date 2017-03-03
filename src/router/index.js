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
        { path: '/', component: Index, name: 'Home' },
        { path: '/badges', component: Badges, name: 'Badges' },
        { path: '/buttons', component: Buttons, name: 'Buttons' },
        { path: '/cards', component: Cards, name: 'Cards' },
        { path: '/data', component: Data, name: 'Data' },
        { path: '/date', component: Date, name: 'Date' },
        { path: '/details', component: Details, name: 'Details' },
        { path: '/dialogs', component: Dialogs, name: 'Dialogs' },
        { path: '/dropdowns', component: Dropdowns, name: 'Dropdowns' },
        { path: '/forms', component: Forms, name: 'Forms' },
        { path: '/lists', component: Lists, name: 'Lists' },
        { path: '/notifications', component: Notifications, name: 'Notifications' },
        { path: '/pagination', component: Pagination, name: 'Pagination' },
        { path: '/tables', component: Tables, name: 'Tables' },
        { path: '/tabs', component: Tabs, name: 'Tabs' },
        { path: '/tooltips', component: Tooltips, name: 'Tooltips' },
        { path: '*', component: NotFound, name: '404' }
    ],
    mode: 'history',
    linkActiveClass: 'active'
});