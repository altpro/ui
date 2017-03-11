<template>
    <div class="view">
        <div class="heading">
            <h1>Dropdowns</h1>
        </div>

        <div class="card">

            <ui-dropdown persist>
                <button class="button icon" slot="trigger"><i>more_vert</i></button>
                <div class="menu">
                    <button class="link">Options 1</button>
                    <button class="link">Options 2</button>
                    <button class="link">Options 3</button>
                    <button class="link">Options 4</button>
                </div>
            </ui-dropdown>
            <pre><code>
&lt;ui-dropdown persist&gt;
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