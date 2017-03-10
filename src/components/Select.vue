<template>
    <div class="select">
        <button type="button"
                class="selection"
                ref="trigger"
                :id="computedId"
                :disabled="disabled"
                @click="toggle"
                @keyup.down="selectNext"
                @keyup.up="selectPrevious"
                @focus="onFocus"
                @blur="onBlur">
            <span :class="{ placeholder: ! value }">{{ selection }}</span>
            <i>arrow_drop_down</i>
        </button>

        <div class="wrapper" v-if="opened" ref="options">
            <div class="options">
                <div v-for="option in options"
                     class="option"
                     tabindex="0"
                     :class="{ selected: option.value === value }"
                     v-html="option.name"
                     @click="select(option)"
                     @keyup.space="select(option)"
                     @keyup.down="selectNext"
                     @keyup.up="selectPrevious">
                </div>
            </div>
        </div>

        <input type="text"
               tabindex="-1"
               style="display: none"
               :name="name"
               :value="value"
               :disabled="disabled"
               :required="required">
    </div>
</template>

<script>
    import uuid from '../utils/uuid';

    export default {
        props: {
            name: String,
            id: String,
            value: null,
            options: Array,
            multiple: Boolean,
            placeholder: String,
            disabled: Boolean,
            required: Boolean
        },

        data() {
            return {
                opened: false,
                focus: false
            }
        },

        computed: {
            // TODO: First default
            selection() {
                return this.options.filter(o => o.value === this.value).map(o => o.name)[0] || this.placeholder;
            },

            computedId() {
                return this.id ? this.id : uuid();
            }
        },

        methods: {
            toggle() {
                if (this.opened) {
                    this.close();
                } else {
                    this.open();
                }
            },

            open() {
                this.opened = true;
                document.addEventListener('click', this.close);
                document.addEventListener('keydown', this.close);

                this.$nextTick(function () {
                    const rect = this.$refs.options.getBoundingClientRect();
                    if (rect.bottom > window.innerHeight) {
                        this.$refs.options.style.height = `${(window.innerHeight - rect.top) - 16}px`;
                    }
                });
            },

            close(e) {
                if (!e || !this.$el.contains(e.target) || (e.which === 27 || e.keyCode === 27)) {
                    this.opened = false;
                    document.removeEventListener('click', this.close);
                    document.removeEventListener('keydown', this.close);
                }
            },

            select(option, persist) {
                this.$emit('input', option.value);
                if (! persist) {
                    this.close();
                    this.$refs.trigger.focus();
                }
            },

            selectNext() {
                const selected = this.options.filter(o => o.value === this.value)[0];
                const next = this.options.indexOf(selected) + 1;

                if (this.options.length > next) {
                    this.select(this.options[next], true);
                }
            },

            selectPrevious() {
                const selected = this.options.filter(o => o.value === this.value)[0];
                const prev = this.options.indexOf(selected) - 1;

                if (prev > -1) {
                    this.select(this.options[prev], true);
                }
            },

            onFocus() {
                this.focus = true;
                this.$emit('focus');
            },

            onBlur() {
                this.focus = false;
                this.$emit('blur');
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    .select {
        position: relative;
        > .selection {
            display: flex;
            justify-content: space-between;
            align-items: center;

            font-family: inherit;
            position: relative;
            border: none;
            outline: none;
            box-shadow: none;
            background: transparent;
            margin: 0;
            padding: 4px 0;
            width: 100%;
            max-width: 100%;
            background: none;
            text-align: left;
            color: darken($text, 10%);
            font-size: 15px;

            > i {
                color: $grey-light;
                margin-left: 16px;
            }
        }

        > .wrapper {
            @media #{$mobile} {
                z-index: 16;
                position: fixed;
                top: 0;
                left: 0;
                bottom: 0;
                right: 0;
                background: rgba(0,0,0, 0.4);
                display: flex;
                justify-content: center;
                align-items: center;
            }

            @media #{$desktop} {
                display: block;
                position: absolute;
                z-index: 9;
                max-height: 50vh;
                top: calc(100% + 2px);
                width: 100%;
                @include shadow-4dp;
                overflow-y: auto;
            }
        }

        .options {
            background: #fff;
            position: relative;
            @media #{$mobile} {
                display: block;
                width: 75vw;
                max-height: 75vh;
                background: #fff;
                border-radius: 2px;
                overflow-y: auto;
                @include shadow-4dp;
            }
        }

        .option {
            color: $text;
            font-size: 15px;
            display: flex;
            align-items: center;
            line-height: 1.2;
            padding: 8px 16px;

            &.checked {
                i {
                    color: $primary;
                }
            }

            &:hover, &:focus, &.selected {
                background: $primary;
                color: #fff;
                i {
                    color: #fff;
                }
            }
        }

        .check {
            display: inline-flex;
            width: 60px;
        }
    }

</style>
