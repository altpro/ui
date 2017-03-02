<template>
    <div class="view">
        <div class="heading">
            <h1>Date</h1>
        </div>

        <div class="card">
            <p>Date picker component accepts & outputs MySQL date/datetime format whilst displaying in UK format.</p>
            <ui-field label="Date Picker">
                <ui-date v-model="date"></ui-date>
            </ui-field>
            <p>Add the <code>time</code> attribute to enable the time input/output.</p>
            <ui-field label="Datetime Picker">
                <ui-date time v-model="datetime"></ui-date>
            </ui-field>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                date: null,
                datetime: null
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

</style>