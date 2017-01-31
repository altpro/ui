<template>
    <div class="field" :class="{ focus: focus, disabled: disabled, invalid: invalid }">
        <label :for="id">
            <slot name="label">{{ label }}</slot><sup v-if="required">*</sup>
        </label>
        <div class="input" :class="{ 'focus': focus }" ref="input">
            <slot></slot>
        </div>
        <div class="hint" v-if="hint || maxlength || errorMessage">
            <span>{{ errorMessage }} <slot name="hint">{{ hint }}</slot></span>
            <span class="counter" v-if="maxlength">{{ value ? value.length : 0 }}/{{ maxlength }}</span>
        </div>
    </div>
</template>

<script>
    import uuid from '../utils/uuid';

    export default {
        props: ['label', 'hint', 'error'],

        data() {
            return {
                id: null,
                value: null,
                required: false,
                maxlength: null,
                focus: false,
                invalid: false,
                disabled: false,
                errorMessage: null
            }
        },

        mounted() {
            this.input = this.$refs.input.firstChild;

            this.setAttributes();

            this.input.addEventListener('focus', this.onFocus);
            this.input.addEventListener('blur', this.onBlur);
            this.input.addEventListener('input', this.onInput);
//            this.input.addEventListener('change', this.onInput);
        },

        methods: {
            setAttributes() {
                this.id = this.input.getAttribute('id');
                if (! this.id) {
                    this.id = 'input-' + uuid();
                    this.input.setAttribute('id', this.id);
                }
                this.disabled = this.input.getAttribute('disabled');
                this.required = this.input.getAttribute('required');
                this.value = this.input.getAttribute('value');
                this.maxlength = this.input.getAttribute('maxlength');
                // TODO: Respond to input element attribute changes
            },

            onFocus() {
                this.focus = true;
                this.$emit('focus');
            },

            onInput(e) {
                this.value = e.target.value;
                if (this.invalid) {
                    this.checkValidity();
                }
            },

            onBlur() {
                this.checkValidity();
                this.focus = false;
                this.$emit('blur');
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

    .field {
        position: relative;
        margin-bottom: 16px;
        color: $field;

        &.focus {
            color: $primary;
        }

        &.disabled {
            color: lighten($field, 20%);
            cursor: not-allowed;
        }

        &.invalid {
            color: $danger;
        }
    }

    label {
        padding-top: 2px;
        display: block;
        font-size: 12px;
        color: inherit;
    }

    .disabled label {
        color: lighten($field, 20%);
        cursor: not-allowed;
    }

    input, textarea, .selection {
        font-family: inherit;
        position: relative;
        border: none;
        outline: none;
        box-shadow: none;
        background: transparent;
        display: block;
        margin: 0;
        padding: 4px 0;
        width: 100%;
        max-width: 100%;
        background: none;
        text-align: left;
        color: darken($text, 10%);
        font-size: 16px;
    }

    .disabled {
        input, textarea, .selection {
            color: lighten($text, 20%);
            cursor: not-allowed;
        }
    }

    .input {
        border-bottom: 1px solid $divider;
        position: relative;

        &:after {
            display: block;
            background-color: currentColor;
            bottom: -1;
            content: '';
            height: 2px;
            left: 48%;
            position: absolute;
            width: 4%;
            transition: 0.2s ease-in-out;
            visibility: hidden;
        }

        &.focus {
            &:after {
                left: 0;
                visibility: visible;
                width: 100%;
            }
        }
    }

    .invalid {
        .input {
            border-bottom: 1px solid $danger;
        }
    }

    .hint {
        font-size: 12px;
        color: inherit;
        display: flex;
        justify-content: space-between;
    }

    ::placeholder, .placeholder {
        color: lighten($field, 15%);
    }


</style>
