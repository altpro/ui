<template>
    <div class="switch" :class="{ 'inline': inline }">
        <label>
            <input type="checkbox"
                   :value="1"
                   :name="name"
                   :id="computedId"
                   :checked="value"
                   @blur="focus = ! focus"
                   @change="onInput">
            <div class="switch-track" :class="{ 'is-on': value }"></div>
            <div class="switch-toggle" :class="{ 'is-on': value }"></div>

            {{ label }}
            <slot name="label"></slot>
        </label>
    </div>
</template>

<script>

    export default {

        props: {
            label: String,
            name: String,
            id: String,
            value: {
                type: [String, Number, Boolean],
                default: false
            },
            boolean: {
                type: Boolean,
                default: true
            },
            inline: {
                type: Boolean,
                default: false
            }
        },

        data() {
            return {
                focus: false,
                randomId: 'input-' + Math.random()
            }
        },

        computed: {
            computedId() {
                return this.id ? this.id : this.randomId;
            }
        },

        methods: {
            onInput() {
                this.focus = false;
                this.$emit('input', ! this.value);
            }

        }
    }
</script>
