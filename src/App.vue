<template>
    <div id="#app">
        <header id="header">
            <button class="button icon" id="drawer-button" @click="$refs.drawer.toggle()"><i>menu</i></button>
            <div class="title">UI</div>
            <button class="button icon"><i>search</i></button>
            <button class="button icon"><i>help_outline</i></button>
        </header>

        <ui-drawer ref="drawer" id="drawer">
            <router-link to="/" exact>Home</router-link>
            <hr>
            <router-link to="/badges">Badges</router-link>
            <router-link to="/buttons">Buttons</router-link>
            <router-link to="/cards">Cards</router-link>
            <router-link to="/data">Data</router-link>
            <router-link to="/date">Date</router-link>
            <router-link to="/details">Details</router-link>
            <router-link to="/dialogs">Dialogs</router-link>
            <router-link to="/drawer">Drawer</router-link>
            <router-link to="/dropdowns">Dropdowns</router-link>
            <router-link to="/forms">Forms</router-link>
            <router-link to="/lists">Lists</router-link>
            <router-link to="/notifications">Notifications</router-link>
            <router-link to="/pagination">Pagination</router-link>
            <router-link to="/tables">Tables</router-link>
            <router-link to="/tabs">Tabs</router-link>
            <router-link to="/tooltips">Tooltips</router-link>
            <div v-if="$router.currentRoute.name === 'drawer'">
                <hr>
                <h4>Drawer demo</h4>
                <router-link to="#1"><i>person</i> Link 1</router-link>
                <details :open="/^\/drawer/.test($router.currentRoute.path)">
                    <summary><i>view_list</i> Link 2</summary>
                    <router-link to="#2.1">Link 2.1</router-link>
                    <router-link to="#2.2">Link 2.2</router-link>
                    <details>
                        <summary>Link 2.3</summary>
                        <router-link to="#2.3.1">Link 2.3.1</router-link>
                        <router-link to="#2.3.2">Link 2.3.2</router-link>
                    </details>
                </details>
                <details>
                    <summary><i>trending_up</i> Link 3</summary>
                    <router-link to="#3.1">Link 3.1</router-link>
                    <router-link to="#3.2">Link 3.2</router-link>
                    <details>
                        <summary>Link 3.3</summary>
                        <router-link to="#3.3.1">Link 3.3.1</router-link>
                        <router-link to="#3.3.2">Link 3.3.2</router-link>
                    </details>
                </details>
                <router-link to="#1"><i>settings</i> Link 4</router-link>

            </div>

        </ui-drawer>

        <main id="main">
            <transition name="fade" mode="out-in" appear>
                <router-view></router-view>
            </transition>
        </main>

        <ui-notification></ui-notification>
    </div>
</template>

<script>
    export default {
        data() {
            return {

            }
        },

        methods: {

        }
    }
</script>

<style lang="scss">
    @import "styles/_global.scss";

    #main {
        background: $primary;
        background-image: radial-gradient(
                ellipse farthest-side at 10% 0,
                rgba(74, 121, 147, 0.89),
                rgba(204, 204, 204, 0.85) 80%,
                rgba(185, 135, 131, 0.87) 120%
        );
        background-attachment: fixed, fixed;
    }

    h1, h1 a {
        color: #fff;
        font-weight: 300;
    }
</style>
