<template>
    <div class="view">
        <div class="heading">
            <h1>Buttons</h1>
        </div>
        <div class="card">
            <p>The button element has default border, background etc. reset to allow easy use in other components (menu, pagination etc.). Applying a <code>.button</code> class adds the basic flat material styling.</p>
            <p>
                <button class="button">.button</button>
            </p>

            <p>The button css classes can be added to a <code>button</code> or <code>.button</code> element to apply the material styles.</p>
            <h2>Classes</h2>
            <p class="buttons">
                <button class="action">.action</button>
                <button class="raised">.raised</button>
            </p>
            <p class="buttons">
                <button class="primary">.primary</button>
                <button class="secondary">.secondary</button>
                <button class="success">.success</button>
                <button class="info">.info</button>
                <button class="warning">.warning</button>
                <button class="danger">.danger</button>
            </p>
            <p class="buttons">
                <button class="primary-color">.primary-color</button>
                <button class="success-color">.success-color</button>
                <button class="info-color">.info-color</button>
                <button class="warning-color">.warning-color</button>
                <button class="danger-color">.danger-color</button>
            </p>

            <h2>Types</h2>
            <div class="buttons">
                <button class="fab"><i>add</i></button> .fab
                <button class="fab primary"><i>add</i></button> .fab.primary
                <button class="fab"><i>add</i></button> .fab
                <button class="fab mini"><i>add</i></button> .fab.mini
                <button class="icon"><i>person</i></button> .icon
                <button class="icon primary"><i>person</i></button> .icon.primary
            </div>

            <div class="actions">
                <a href="https://github.com/altpro/ui/blob/master/src/docs/Buttons.vue" target="_blank" class="button">Docs Source</a>
            </div>
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