<template>
    <div class="view">
        <div class="heading">
            <h1>Dropdowns</h1>
        </div>

        <div class="card">

            <ui-dropdown persist>
                <button class="button icon" slot="trigger"><i>more_vert</i></button>
                <div class="menu">
                    <div class="link">Option 1</div>
                    <div class="link">Option 2</div>
                    <div class="link">Option 3</div>
                    <div class="link">Option 4</div>
                </div>
            </ui-dropdown>
            <pre><code>
&lt;ui-dropdown&gt;
    &lt;button class="button icon" slot="trigger"&gt;&lt;i&gt;more_vert&lt;/i&gt;&lt;/button&gt;
    &lt;div class="menu"&gt;
        &lt;div class="link"&gt;Option 1&lt;/div&gt;
        &lt;div class="link"&gt;Option 2&lt;/div&gt;
        &lt;div class="link"&gt;Option 3&lt;/div&gt;
        &lt;div class="link"&gt;Option 4&lt;/div&gt;
    &lt;/div&gt;
&lt;/ui-dropdown&gt;</code></pre>

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