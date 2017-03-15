<template>
    <div class="select" :class="{ 'focus': focus }" @contextmenu.prevent="$refs.context.show">
        <button type="button"
                class="selection"
                id="computedId"
                :disabled="disabled"
                ref="trigger"
                @click="toggle"
                @keyup.down="openAndFocus"
                @focus="onFocus"
                @blur="onBlur">
            <span :class="{ placeholder: ! value || value.length === 0 }" v-html="selection"></span>
            <i>arrow_drop_down</i>
        </button>

        <div class="wrapper" v-if="opened" ref="options">
            <div class="options-container">
                <div class="options multiple">
                    <div v-for="option in options"
                         tabindex="0"
                         class="option"
                         :class="{ checked: isSelected(option) }"
                         @keydown.down="focusNext"
                         @keydown.up="focusPrevious"
                         @click="toggleOption(option)"
                         @keyup.space="toggleOption(option)">
                        <span class="check">
                            <i v-if="! isSelected(option)">check_box_outline_blank</i>
                            <i v-if="isSelected(option)">check_box</i>
                        </span>
                        <span v-html="option.name"></span>
                    </div>
                </div>

                <div class="actions">
                    <button class="primary-colour" type="button" @click="forceClose">Ok</button>
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

        <ui-context ref="context">
            <div class="menu">
                <button class="link" @click="selectAll">Select all</button>
                <button class="link" @click="deselectAll">Deselect all</button>
            </div>
        </ui-context>
    </div>
</template>

<script>
    import UiContext from './Context.vue';
    import uuid from '../utils/uuid';

    export default {
        props: {
            name: String,
            id: String,
            value: Array,
            options: Array,
            placeholder: String,
            separator: {
                type: String,
                default: ', '
            },
            finalSeparator: String,
            required: Boolean,
            disabled: Boolean
        },

        data() {
            return {
                opened: false,
                focus: false,
            }
        },

        computed: {
            selection() {
                if (! this.value || this.value.length === 0) {
                    return this.placeholder;
                }

                const selection = this.options.filter(o => this.value.indexOf(o.value) > -1).map(o => o.name);

                if (! this.finalSeparator || selection.length === 1) {
                    return selection.join(this.separator);
                } else {
                    const final = selection.pop();
                    return selection.join(this.separator) + ' ' + this.finalSeparator + ' ' + final;
                }
            },

            computedId() {
                return this.id ? this.id : uuid();
            }
        },

        components: { UiContext },

        created() {
            if (! Array.isArray(this.value)) {
                this.$emit('input', []);
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

                this.$nextTick(function() {
                    const rect = this.$refs.options.getBoundingClientRect();
                    if (rect.bottom > window.innerHeight) {
                        this.$refs.options.style.height = `${(window.innerHeight - rect.top) - 16}px`;
                    }
                });
            },

            close(e) {
                if (! e || ! this.$el.contains(e.target) || (e.which === 27 || e.keyCode === 27)) {
                    this.opened = false;
                    document.removeEventListener('click', this.close);
                    document.removeEventListener('keydown', this.close);
                    this.$refs.trigger.focus();
                }
            },

            forceClose() {
                this.close();
            },

            isSelected(option) {
                return this.value.indexOf(option.value) > -1;
            },

            toggleOption(option) {
                const selected = Array.from(this.value);
                const index = selected.indexOf(option.value);
                if (index > -1) {
                    selected.splice(index, 1);
                } else {
                    selected.push(option.value);
                }

                this.$emit('input', selected);
            },

            openAndFocus() {
                this.open();
                this.$nextTick(function() {
                    this.$refs.options.firstChild.focus();
                });
            },

            focusNext(e) {
                const next = e.target.nextSibling;
                if (next) {
                    next.focus();
                }
            },

            focusPrevious(e) {
                const previous = e.target.previousSibling;
                if (previous) {
                    previous.focus();
                } else {
                    this.close();
                }
            },

            selectAll() {
                const all = this.options.map(o => o.value);
                this.$emit('input', all);
            },

            deselectAll() {
                this.$emit('input', []);
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

    .options.multiple {
        box-shadow: none;
    }

    .options-container {
        background: #fff;
        box-shadow: var(--shadow-4dp);

        .actions {
            border-top: 1px solid var(--divider);
            padding: 8px;
            display: flex;
            justify-content: flex-end;

            @media #{$desktop} {
                display: none;
            }
        }
    }

</style>
