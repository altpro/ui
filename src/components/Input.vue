<template>
    <div class="field" :class="{ focus: focus, disabled: disabled, invalid: invalid }">
        <label :for="computedId">
            <slot name="label">{{ label }}</slot><sup v-if="required">*</sup>
        </label>
        <div class="input" :class="{ 'focus': focus }">
            <input ref="input"
                   :type="type"
                   :value="value"
                   :name="name"
                   :id="computedId"
                   :min="min"
                   :max="max"
                   :maxlength="maxlength"
                   :required="required"
                   :pattern="pattern"
                   :placeholder="placeholder"
                   :disabled="disabled"
                   :autofocus="autofocus"
                   :readonly="readonly"
                   @focus="onFocus"
                   @input="onInput"
                   @blur="onBlur">
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
        props: {
            type: {
                type: String,
                default: 'text'
            },
            label: String,
            name: String,
            id: String,
            value: [String, Number],
            min: [String, Number],
            max: [String, Number],
            step: [String, Number],
            maxlength: [String, Number],
            placeholder: String,
            autofocus: Boolean,
            readonly: Boolean,
            disabled: Boolean,
            required: Boolean,
            pattern: String,
            hint: String,
            error: String
        },

        data() {
            return {
                focus: false,
                invalid: false,
                errorMessage: null,
                randomId: 'input-' + uuid()
            }
        },

        computed: {
            computedId() {
                return this.id ? this.id : this.randomId;
            }
        },

        methods: {
            onFocus() {
                this.focus = true;
                this.$emit('focus');
            },

            onInput(e) {
                if (this.invalid) {
                    this.checkValidity();
                }

                this.$emit('input', e.target.value)
            },

            onBlur() {
                this.checkValidity();
                this.focus = false;
                this.$emit('blur');
            },

            checkValidity() {
                if (! this.$refs.input.checkValidity()) {
                    this.invalid = true;
                    this.errorMessage = this.error ? this.error : this.$refs.input.validationMessage;
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
