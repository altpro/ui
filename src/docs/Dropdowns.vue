<template>
    <div class="view">
        <div class="heading">
            <h1>Dropdowns</h1>
        </div>

        <div class="card">

            <ui-dropdown persist>
                <button class="icon" slot="trigger"><i>more_vert</i></button>
                <div class="menu">
                    <a href="/" class="no-icon">Link</a>
                    <button><i>check</i> Button</button>
                    <hr>
                    <button disabled>Disabled</button>
                    <button>Button</button>
                </div>
            </ui-dropdown>
            <pre>
<code>&lt;ui-dropdown persist&gt;
    &lt;button class="icon" slot="trigger"&gt;&lt;i&gt;more_vert&lt;/i&gt;&lt;/button&gt;
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