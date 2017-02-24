<template>
    <div class="expanding-search" :class="{ open: open || expanded }" :style="{ 'max-width': width }">
        <button class="button icon" @click="show"><i>search</i></button>
        <input type="search"
               ref="input"
               :value="value"
               @blur="hide"
               @input="onInput($event.target.value)">
    </div>
</template>

<script>

    export default {
        props: {
            value: null,
            open: Boolean,
            width: {
                default: '200px'
            }
        },

        data() {
            return {
                expanded: false
            }
        },

        created() {
            if (this.value) {
                this.expanded = true;
            }
        },

        methods: {
            onInput(value) {
                this.$emit('input', value);
            },

            show() {
                this.expanded = true;
                this.$nextTick(() => {
                    this.$refs.input.focus();
                });
            },

            hide() {
                if (! this.value) {
                    this.expanded = false;
                }
            }
        }
    }
</script>


<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    .expanding-search {
        display: inline-flex;
        align-items: center;
        width: 32px;
        overflow: hidden;
        transition: width 0.3s ease-in-out;

        input {
            font-size: 16px;
            border: none;
            border-bottom: 1px solid $divider;
            color: darken($text, 10%);
            width: 100%;
            padding: 0;

            &:focus {
                transform: translate(0, 1px);
                border-bottom: 2px solid $primary;
            }
        }

        &.open {
            width: 100%;
        }
    }

</style>
