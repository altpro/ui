<template>
    <div class="view">
        <div class="heading">
            <h1>Dialogs</h1>
        </div>

        <div class="card">
            <p>Popup element ideal as a styled dialog or alert.</p>
            <button class="button primary" @click="$refs.dialog.show()">
                Test Dialog
            </button>
            <ui-dialog ref="dialog" :open="dialog">
                <h2>Are you sure?</h2>
                <p>Deleting a record can change the output of reports already submitted.</p>
                <template slot="actions">
                    <button class="flat" @click="$refs.dialog.close()">Cancel</button>
                    <button class="action" @click="$refs.dialog.close()">Ok</button>
                </template>
            </ui-dialog>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                dialog: false
            }
        }
    }
</script>