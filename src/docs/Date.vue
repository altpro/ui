<template>
    <div class="view">
        <div class="heading">
            <h1>Date</h1>
        </div>

        <div class="card">
            <ui-field label="Date Picker">
                <ui-date time v-model="date"></ui-date>
            </ui-field>

        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                date: null
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

</style>