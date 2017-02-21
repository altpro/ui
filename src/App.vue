<template>
    <div>
        <header id="header">
            <button class="button icon" id="drawer-button" @click="toggleDrawer"><i>menu</i></button>
            <div class="title">UI</div>
            <button class="button icon"><i>search</i></button>
            <button class="button icon"><i>help_outline</i></button>
        </header>

        <nav id="drawer" :class="{ 'open': drawer }" @focus="openDrawer" tabindex="0">
            <div class="menu">
                <router-link to="/" exact>Home</router-link>
                <div class="divider"></div>
                <router-link to="/badges">Badges</router-link>
                <router-link to="/buttons">Buttons</router-link>
                <router-link to="/cards">Cards</router-link>
                <router-link to="/date">Date</router-link>
                <router-link to="/details">Details</router-link>
                <router-link to="/dialogs">Dialogs</router-link>
                <router-link to="/dropdowns">Dropdowns</router-link>
                <router-link to="/forms">Forms</router-link>
                <router-link to="/lists">Lists</router-link>
                <router-link to="/notifications">Notifications</router-link>
                <router-link to="/pagination">Pagination</router-link>
                <router-link to="/tables">Tables</router-link>
                <router-link to="/tabs">Tabs</router-link>
                <router-link to="/tooltips">Tooltips</router-link>
            </div>
        </nav>

        <main id="main">
            <transition name="fade" mode="out-in" appear>
                <router-view></router-view>
            </transition>
        </main>

        <ui-notification></ui-notification>
        <div id="drawer-closer" @click="closeDrawer" :class="{ 'open': drawer }"></div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                drawer: false
            }
        },

        methods: {
            toggleDrawer() {
                this.drawer = ! this.drawer;
            },

            openDrawer() {
                this.drawer = true;
            },

            closeDrawer() {
                this.drawer = false;
            }
        }
    }
</script>

<style lang="scss">
    @import "styles/_app.scss";

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

    h1 {
        color: #fff;
        font-weight: 300;
    }
</style>
