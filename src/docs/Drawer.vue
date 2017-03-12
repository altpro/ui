<template>
    <div class="view">
        <div class="heading">
            <h1>Drawer</h1>
        </div>

        <div class="card">
            <p>A multi-level navigation drawer inspired by the new Google Analytics menu. All features demo at the bottom of the current drawer</p>
            <p>Fixed open when the screen is greater than the scss <code>$xl-breakpoint</code>.</p>
            <p>
                The <router-link to="/details">details</router-link> element is used to provide the structure.
                At the first level icons work well & styling is applied to transform text to uppercase,
                at the second level the arrow indicator is moved to the left.
                Bind the <code>open</code> attribute to a <a href="https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/RegExp" target="_blank">regex</a>
                test against the url e.g. <code>/^\/drawer/.test(window.location.pathname)</code> or <code>/^\/drawer/.test($router.currentRoute.path)</code>.
            </p>
            <p>
                If required <code>h4</code> elements are ideal as section headings, they are displayed inline with root level icons.
                <code>hr</code> elements can be used as dividers.
            </p>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {

            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";



</style>