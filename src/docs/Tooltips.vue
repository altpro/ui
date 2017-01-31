<template>
    <div class="view">
        <div class="heading">
            <h1>Tooltips</h1>
        </div>

        <div class="card">
            <p>Tooltips are simple css only triggered on hover after a 0.5s delay. Apply to an element by adding a data-tooltip attribute:</p>
            <pre>&lt;span data-tooltip=&quot;Tooltip&quot;&gt;Hover for tooltip&lt;/span&gt;</pre>
            <p><span data-tooltip="Tooltip">Hover for tooltip</span></p>
            <div class="actions">
                <button class="button primary" data-tooltip="Tooltip">Button</button>
                <button class="button icon" data-tooltip="Tooltip">
                    <i>more_vert</i>
                </button>
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