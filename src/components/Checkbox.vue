<template>
    <div class="checkbox" :class="{ 'inline': inline, 'focus': focus }">
        <label>
            <input type="checkbox" @focus="focus = true" @blur="focus = false" :value="1" :name="name" :checked="value" @change="onInput">
            <span class="checkbox-box" ref="rippleTrigger">
                <i v-if="! value">check_box_outline_blank</i>
                <i v-if="value" class="primary">check_box</i>
                <app-ripple></app-ripple>
            </span>

            {{ label }}
            <slot name="label"></slot>
        </label>
    </div>
</template>

<script>
    import AppRipple from './Ripple.vue';

    export default {

        props: {
            label: String,
            name: String,
            value: {
                type: [String, Number, Boolean],
                default: false
            },
            boolean: {
                type: Boolean,
                default: false
            },
            inline: {
                type: Boolean,
                default: false
            }
        },

        components: {
            AppRipple
        },

        data() {
            return {
                focus: false
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
