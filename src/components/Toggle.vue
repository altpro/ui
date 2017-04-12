<template>
    <label class="toggle" :class="{ disabled, focus, invalid }">
        <slot></slot>
        <span class="control" v-if="type === 'checkbox'">
            <i>check_box_outline_blank</i>
            <i>check_box</i>
        </span>
        <span class="control" v-if="type === 'radio'">
            <i>radio_button_unchecked</i>
            <i>radio_button_checked</i>
        </span>
        <span class="switch-control" v-if="type === 'switch'">
            <div class="switch-track"></div>
            <div class="switch-toggle"></div>
        </span>
        <slot name="label">{{ label }}</slot>
    </label>
</template>

<script>
    export default {
        props: ['label', 'error'],

        data() {
            return {
                type: 'checkbox',
                disabled: false,
                focus: false,
                required: false,
                invalid: false,
                errorMessage: null
            }
        },

        mounted() {
            this.input = this.$el.querySelector('input[type="checkbox"], input[type="radio"]');

            this.disabled = this.input.getAttribute('disabled');
            this.required = this.input.getAttribute('required');

            if (this.input.getAttribute('type') === 'radio') {
                this.type = 'radio';
            }

            if (this.$el.classList.contains('switch')) {
                this.type = 'switch';
            }

            this.$el.addEventListener('focusin', () => this.focus = true);
            this.$el.addEventListener('focusout', this.onBlur);

            new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (['disabled', 'required'].indexOf(mutation.attributeName) > -1) {
                        this[mutation.attributeName] = this.input.getAttribute(mutation.attributeName);
                    }
                });
            }).observe(this.input, { attributes: true });
        },

        methods: {
            onBlur() {
                this.checkValidity();
                this.focus = false;
            },

            checkValidity() {
                if (! this.input.checkValidity()) {
                    this.invalid = true;
                    this.errorMessage = this.error ? this.error : this.input.validationMessage;
                } else {
                    this.invalid = false;
                    this.errorMessage = null;
                }
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    .toggle {
        display: flex;
        width: 100%;
        align-items: center;
        position: relative;
        font-size: 15px;
        line-height: 32px;
        padding: 0;

        > .control {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            transform: translate(-8px, 0);
            border-radius: 50%;

            > i {
                display: none;
                color: var(--primary);

                &:first-child {
                    color: inherit;
                    display: inline-block;
                }
            }
        }

        input {
            position: absolute;
            width: 0;
            height: 0;
            opacity: 0;
        }

        input:checked + .control {
            > i {
                display: inline-block;

                &:first-child {
                    display: none;
                }
            }
        }

        &.inline {
            display: inline-flex;
            width: auto;
            margin-right: 24px;
        }

        &.disabled {
            opacity: .8;
            cursor: not-allowed;
        }

        &.focus {
            > .control {
                background: var(--focus);
            }
        }

        &.invalid {
            color: var(--danger);
        }

        &.align-end {
            justify-content: space-between;
            > .control, .switch-control {
                order: 99;
            }
        }

        &.field {
            margin-bottom:16px;
        }

        @each $state, $color in $states {
            &.#{$state} {
                i {
                    color: $color;
                }
            }
        }
    }

    .switch-control {
        position: relative;
        width: 50px;
        height: 32px;
    }

    .switch-track {
        background: var(--light);
        position: absolute;
        left: 0;
        top: 9px;
        height: 14px;
        width: 36px;
        border-radius: 14px;
    }

    .focus .switch-track {
        box-shadow: var(--shadow-3dp);
    }

    .switch-toggle {
        background: var(--lighter);
        position: absolute;
        left: 0;
        top: 6px;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        transition: left 0.1s ease-in-out;
        cursor: pointer;
        box-shadow: var(--shadow-2dp);
    }

    input:checked + .switch-control {
        .switch-track {
            opacity: .8;
            background: var(--primary);
        }
        .switch-toggle {
            background: var(--primary);
            left: 16px;
            box-shadow: var(--shadow-3dp);
        }
    }

    .switch {
        @each $state, $color in $states {
            &.#{$state} {
                input:checked + .switch-control {
                    .switch-track {
                        background: $color;
                    }
                    .switch-toggle {
                        background: $color;
                        left: 16px;
                        box-shadow: var(--shadow-3dp);
                    }
                }
            }
        }
    }

</style>