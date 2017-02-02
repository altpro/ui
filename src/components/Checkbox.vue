<template>
    <div class="checkbox" :class="{ inline: inline, focus: focus, disabled: disabled }">
        <label>
            <input type="checkbox"
                   :name="name"
                   :value="trueValue"
                   :checked="isChecked"
                   :required="required"
                   @focus="focus = true"
                   @blur="focus = false"
                   @change="onInput">
            <span class="checkbox-box">
                <i v-if="isChecked" class="primary">check_box</i>
                <i v-else>check_box_outline_blank</i>
            </span>
            <slot name="label">{{ label }}</slot>
        </label>
    </div>
</template>

<script>
    export default {
        props: {
            label: String,
            name: String,
            value: null,
            trueValue: {
                default: true
            },
            falseValue: {
                default: false
            },
            disabled: Boolean,
            required: Boolean,
            inline: Boolean
        },

        computed: {
            isChecked() {
                return this.value == this.trueValue;
            }
        },

        data() {
            return {
                focus: false
            }
        },

        methods: {
            onInput() {
                const value = this.value == this.trueValue ? this.falseValue : this.trueValue;
                this.$emit('input', value);
            }

        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    .checkbox, .switch, .radios {
        position: relative;

        > label {
            display: flex;
            font-size: 16px;
            line-height: 32px;
            padding: 0;
            color: $text;
        }

        input {
            position: absolute;
            width: 0;
            height: 0;
        }

        &.inline {
            margin-right: 16px;
        }

    }

    .checkbox-box, .radio-control {
        position: relative;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        margin-left: -8px;

        i {
            font-size: 18px;
            padding: 7px;
        }
    }

    .focus .checkbox-box, .focus .radio-control {
        background: $grey-lighter;
    }

    .switch {
        padding-left: 44px;
    }

    .switch-track {
        background: $grey-light;
        position: absolute;
        left: 0;
        top: 9px;
        height: 14px;
        width: 36px;
        border-radius: 14px;

        &.is-on {
            background: lighten($primary, 30%);
        }
    }

    .focus .switch-track {
        @include shadow-2dp();
    }

    .switch-toggle {
        background: $grey-lighter;
        position: absolute;
        left: 0;
        top: 6px;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        transition: left 0.1s ease-in-out;
        cursor: pointer;
        @include shadow-2dp();

        &.is-on {
            background: $primary;
            left: 16px;
            @include shadow-3dp();
        }
    }

    @each $state, $color in $states {
        .switch.#{$state} {
            .switch-track.is-on {
                background: lighten($color, 30%);
            }
            .switch-toggle.is-on {
                background: $color;
            }
        }
    }

</style>
