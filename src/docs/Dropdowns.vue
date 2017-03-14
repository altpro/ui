<template>
    <div class="view">
        <div class="heading">
            <h1>Dropdowns</h1>
        </div>

        <div class="card">
            <p>Dropdown component ideal for menus. Overflows with a scrollbar rather than drop below the viewport.</p>
            <p>Add <code>slot="trigger"</code> to the trigger element, default slot is the dropdown content, ideally <code>.menu</code></p>
            <p>By default will close on any click, set a <code>persist</code> attribute to keep open, close with the <code>close()</code> method.</p>
            <p>Accepts <code>a</code>, <code>button</code> or <code>.button</code> elements as options. <code>hr</code> as dividers, <code>h4</code> for headings.</p>
            <p>When adding icons use the <code>.no-icon</code> class on sibling elements to bring inline.</p>

            <ui-dropdown persist>
                <button class="icon" slot="trigger"><i>more_vert</i></button>
                <div class="menu">
                    <button>Option 1</button>
                    <button>Option 2</button>
                    <button>Option 3</button>
                    <hr>
                    <h4>With icons</h4>
                    <button :class="{ 'no-icon': !check1 }" @click="check1 = !check1">
                        <i v-if="check1">check</i> Option 4
                    </button>
                    <button :class="{ 'no-icon': !check2 }" @click="check2 = !check2">
                        <i v-if="check2">check</i> Option 5
                    </button>
                    <hr>
                    <button disabled>Disabled</button>
                </div>
            </ui-dropdown>

        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                check1: true,
                check2: false
            }
        }
    }
</script>