<template>
    <div class="view">
        <div class="heading">
            <h1>Notifications</h1>
        </div>

        <div class="card">
            <button class="button primary" @click="$root.$emit('notification', 'Something happened')">Test</button>
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