<template>
    <div class="view">
        <div class="heading">
            <h1>Badges</h1>
        </div>

        <div class="card">
            <p>Badges are simple css after pseudo elements with space for up to 3 (ideally just 2) characters. Apply to an element by adding a data-badge attribute:</p>
            <p><button class="button icon" data-badge="12"><i>notifications</i></button> <button class="button icon" data-badge="22"><i>email</i></button></p>
            <p>Style with <code>#{color}-badge</code> class</p>
            <p><button class="button icon success-badge" data-badge="12"><i>notifications</i></button> <button class="button icon danger-badge" data-badge="222"><i>email</i></button></p>
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