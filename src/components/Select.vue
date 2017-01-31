<template>
    <div class="field" :class="{ 'focus': focus || open }">
        <label :for="computedId">{{ label }}
            <slot name="label"></slot>
        </label>
        <div class="input select" :class="{ 'focus': focus }">
            <input type="hidden"
                   :name="name"
                   :value="value">

            <button type="button"
                    class="selection"
                    id="computedId"
                    :disabled="disabled"
                    ref="trigger"
                    @click="toggle"
                    @keyup.down="selectNext"
                    @keyup.up="selectPrevious"
                    @focus="focus = true"
                    @blur="focus = false">
                <span :class="{ placeholder: ! value }">{{ selection }}</span>
                <i>arrow_drop_down</i>
            </button>

            <div class="options" v-if="open" ref="options">
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
        <div class="help"><span>{{ help }}<slot name="help"></slot></span></div>
    </div>
</template>

<script>
    import Platform from '../utils/platform';
    import uuid from '../utils/uuid';

    export default {
        props: {
            label: String,
            name: String,
            id: String,
            value: null,
            options: Array,
            multiple: Boolean,
            placeholder: String,
            help: String,
            disabled: Boolean
        },

        data() {
            return {
                open: false,
                isDesktop: Platform.is.desktop,
                focus: false,
                randomId: 'select-' + uuid()
            }
        },

        computed: {
            // TODO: First default
            selection() {
                return this.options.filter(o => o.value === this.value).map(o => o.name)[0] || this.placeholder;
            },

            computedId() {
                return this.id ? this.id : this.randomId;
            }
        },

        methods: {
            toggle() {
                if (this.open) {
                    this.hide();
                } else {
                    this.show();
                }
            },

            show() {
                this.open = true;
                document.addEventListener('click', this.hide);
                document.addEventListener('keydown', this.hide);

                this.$nextTick(function () {
                    const rect = this.$refs.options.getBoundingClientRect();
                    if (rect.bottom > window.innerHeight) {
                        this.$refs.options.style.height = `${(window.innerHeight - rect.top) - 16}px`;
                    }
                });
            },

            hide(e) {
                if (!e || !this.$el.contains(e.target) || (e.which === 27 || e.keyCode === 27)) {
                    this.open = false;
                    document.removeEventListener('click', this.hide);
                    document.removeEventListener('keydown', this.hide);
                }
            },

            select(option, persist) {
                this.$emit('input', option.value);
                if (!persist) {
                    this.hide();
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
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    .select {
        > .selection {
            display: flex;
            justify-content: space-between;
            align-items: center;

            > i {
                color: $grey-light;
                margin-left: 16px;
            }
        }

        > .options {
            display: block;
            position: absolute;
            z-index: 9;
            background: #fff;
            overflow-y: auto;
            max-height: 50vh;
            top: calc(100% + 2px);
            width: 100%;
            color: $text;
            @include shadow-4dp;

            &.open {
                display: block;
            }
        }

        .option {
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
