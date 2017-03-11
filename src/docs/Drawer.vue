<template>
    <div class="view">
        <div class="heading">
            <h1>Drawer</h1>
        </div>

        <div class="card">
            <p>A multi-level navigation drawer inspired by the new Google Analytics menu.</p>
            <p>Fixed open when the screen is greater than the scss <code>$xl-breakpoint</code>.</p>
            <p>
                The <router-link to="/details">details</router-link> element is used to provide the structure.
                At the first level icons work well & styling is applied to transform text to uppercase,
                at the second level the arrow indicator is moved to the left.
             </p>
            <p>
                Bind the <code>open</code> attribute to a <a href="https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/RegExp" target="_blank">regex</a>
                test against the url e.g. <code>/^\/drawer/.test(window.location.pathname)</code>.
            </p>
            <p>
                If required <code>h4</code> elements are ideal as section headings.
                <code>hr</code> elements can be used as dividers.
            </p>

            <!--<details :open="/^\/drawer/.test(window.location.pathname)">-->
                <!--<summary><i>view_list</i> Link 1</summary>-->
                <!--<router-link to="#" exact>Link 1.1</router-link>-->
                <!--<router-link to="#" exact>Link 1.2</router-link>-->
                <!--<details>-->
                    <!--<summary>Link 1.3</summary>-->
                    <!--<router-link to="#" exact>Link 1.3.1</router-link>-->
                    <!--<router-link to="#" exact>Link 1.3.2</router-link>-->
                <!--</details>-->
            <!--</details>-->

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