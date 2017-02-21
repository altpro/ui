<template>
    <div class="view">
        <div class="heading">
            <h1>Pagination</h1>
        </div>

        <div class="card">
            <p>A component to control pagination. Right aligned with op</p>
            <ui-pagination :items="100" v-model="page" :options="[10, 25, 50]" :display="display" @change="display = arguments[0]"></ui-pagination>
            <h2>Props</h2>
            <table style="margin-bottom: 1em;">
                <thead>
                    <tr>
                        <th>Prop</th>
                        <th>Value</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>value</code></td>
                        <td>Number<sup>*</sup></td>
                        <td>The current page, bind using <code>v-model</code></td>
                    </tr>
                    <tr>
                        <td><code>items</code></td>
                        <td>Number<sup>*</sup></td>
                        <td>The number of items being pagination e.g. <code>Array.length</code></td>
                    </tr>
                    <tr>
                        <td><code>display</code></td>
                        <td>Number (25)</td>
                        <td>The number of items to display per page</td>
                    </tr>
                    <tr>
                        <td><code>options</code></td>
                        <td>Array (null)</td>
                        <td>The display options e.g. <code>[10, 25, 50]</code>, if used set the display prop on change event: <code>@change="display = arguments[0]"</code></td>
                    </tr>
                </tbody>
            </table>
            <p><sup>*</sup><small>Required</small></p>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                page: 1,
                display: 25
            }
        }
    }
</script>