import { createApp } from 'vue';
import Workspace from './Workspace.vue';
const target = document.getElementById('demo-app');
createApp(Workspace, { screen: target.dataset.screen }).mount(target);
