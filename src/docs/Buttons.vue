<template>
    <div class="view">
        <div class="heading">
            <h1>Buttons</h1>
            <div class="actions">
                <button class="button primary">Profile <i>arrow_drop_down</i></button>
                <button class="button fab"><i>add</i></button>
            </div>
        </div>
        <div class="card">
            <p>The button element has an html button as it's root element. The only functionality of the component is to add a ripple on click.</p>
            <p>
                <button>Default</button>
                <button class="button">Default Button</button>
                <button class="button primary-colour">.coloured</button>
            </p>

            <h2>Classes</h2>
            <p class="buttons">
                <button class="button primary">.primary</button>
                <button class="button secondary">.secondary</button>
                <button class="button success">.success</button>
                <button class="button info">.info</button>
                <button class="button warning">.warning</button>
                <button class="button danger">.danger</button>
                <button class="button raised">.raised</button>
            </p>
            <div class="buttons">
                <button class="button fab"><i>add</i></button> .fab
                <button class="button fab mini"><i>add</i></button> .fab.mini
                <button class="button icon"><i>person</i></button> .icon
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