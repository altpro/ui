<template>
    <div class="view">
        <div class="heading">
            <h1>Dialogs</h1>
        </div>

        <div class="card">
            <button class="button primary" @click="showDialog = true">
                Test Dialog
            </button>
            <ui-dialog v-if="showDialog" @close="showDialog = false" ref="dialog">
                <h2>Are you sure?</h2>
                <p>Deleting a record can change the output of reports already submitted.</p>
                <template slot="actions">
                    <button class="button coloured" @click="$refs.dialog.close()">Cancel</button>
                    <button class="button coloured" @click="$refs.dialog.close()">Ok</button>
                </template>
            </ui-dialog>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                showDialog: false
            }
        }
    }
</script>