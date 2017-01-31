<template>
    <div class="field" :class="{ 'focus': focus || open, 'disabled': disabled }" @contextmenu.prevent="$refs.context.show()">
        <label :for="computedId">{{ label }}<slot name="label"></slot></label>
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
                    @keyup.down="showAndFocus"
                    @focus="focus = true"
                    @blur="focus = false">
                <span :class="{ placeholder: ! value || value.length === 0 }" v-html="selection"></span>
                <i>arrow_drop_down</i>
            </button>

            <div class="options multiple" v-if="open" ref="options">
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
        </div>
        <div class="help"><span>{{ help }}<slot name="help"></slot></span></div>

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
    import Platform from '../utils/platform';
    import uuid from '../utils/uuid';

    export default {
        props: {
            label: String,
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
                return this.id ? this.id : this.randomId;
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

                this.$nextTick(function() {
                    const rect = this.$refs.options.getBoundingClientRect();
                    if (rect.bottom > window.innerHeight) {
                        this.$refs.options.style.height = `${(window.innerHeight - rect.top) - 16}px`;
                    }
                });
            },

            hide(e) {
                if (! e || ! this.$el.contains(e.target) || (e.which === 27 || e.keyCode === 27)) {
                    this.open = false;
                    document.removeEventListener('click', this.hide);
                    document.removeEventListener('keydown', this.hide);
                    this.$refs.trigger.focus();
                }
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

            showAndFocus() {
                this.show();
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
                    this.hide();
                }
            },

            selectAll() {
                const all = this.options.map(o => o.value);
                this.$emit('input', all);
            },

            deselectAll() {
                this.$emit('input', []);
            }
        }
    }
</script>
