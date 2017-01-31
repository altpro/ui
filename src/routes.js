import Index from './docs/Index.vue';
import NotFound from './docs/NotFound.vue';

import Badges from './docs/Badges.vue';
import Buttons from './docs/Buttons.vue';
import Cards from './docs/Cards.vue';
import Collapse from './docs/Collapse.vue';
import Dialogs from './docs/Dialogs.vue';
import Dropdowns from './docs/Dropdowns.vue';
import Forms from './docs/Forms.vue';
import Lists from './docs/Lists.vue';
import Notifications from './docs/Notifications.vue';
import Tables from './docs/Tables.vue';
import Tabs from './docs/Tabs.vue';
import Tooltips from './docs/Tooltips.vue';


export default {
    routes: [
        { path: '/', component: Index },
        { path: '/badges', component: Badges },
        { path: '/buttons', component: Buttons },
        { path: '/cards', component: Cards },
        { path: '/collapse', component: Collapse },
        { path: '/dialogs', component: Dialogs },
        { path: '/dropdowns', component: Dropdowns },
        { path: '/forms', component: Forms },
        { path: '/lists', component: Lists },
        { path: '/notifications', component: Notifications },
        { path: '/tables', component: Tables },
        { path: '/tabs', component: Tabs },
        { path: '/tooltips', component: Tooltips },
        { path: '*', component: NotFound }
    ],
    mode: 'history',
    linkActiveClass: 'active'
};