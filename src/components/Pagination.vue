<template>
    <div class="pagination">
        <div class="show" v-if="options">
            Show:
            <ui-dropdown>
                <button slot="trigger">{{ display }} <i>arrow_drop_down</i></button>
                <div class="menu">
                    <button type="button"
                            class="item"
                            v-for="option in options"
                            @click="show(option)"
                            v-text="option">
                    </button>
                    <button type="button"
                            class="item"
                            @click="show(items)"
                            v-text="items">
                    </button>
                </div>
            </ui-dropdown>
        </div>
        <div class="summary" v-if="! simple">
            {{ from }} &ndash; {{ to }} of {{ items }}
        </div>
        <div class="controls">
            <button type="button" v-if="! simple" @click="first" :disabled="value === 1"><i>first_page</i></button>
            <button type="button" @click="prev" :disabled="value === 1"><i>chevron_left</i></button>
            <span class="spacer"></span>
            <button type="button" @click="next" :disabled="value === pages"><i>chevron_right</i></button>
            <button type="button" v-if="! simple" @click="last" :disabled="value === pages"><i>last_page</i></button>
        </div>
    </div>
</template>

<script>
    import UiDropdown from './Dropdown.vue';

    export default {
        props: {
            simple: Boolean,
            options: Array,
            display: {
                default: 25
            },
            value: Number,
            items: Number
        },

        computed: {
            pages() {
                return Math.ceil(this.items / this.display);
            },

            from() {
                return this.page === 1 ? 1 : (this.value - 1) * this.display;
            },

            to() {
                const to = this.value * this.display;

                return this.items < to ? this.items : to;
            }
        },

        data() {
            return {}
        },

        components: {
            UiDropdown
        },

        methods: {
            first() {
                this.$emit('input', 1);
            },

            next() {
                if (this.value < this.pages) {
                    this.$emit('input', this.value + 1);
                }
            },

            prev() {
                if (this.value > 1) {
                    this.$emit('input', this.value - 1);
                }
            },

            last() {
                this.$emit('input', this.pages);
            },

            show(option) {
                this.$emit('change', option);
                this.$emit('input', 1);
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    .pagination {
        display: flex;
        align-items: center;
        justify-content: flex-end;

        .show, .summary, .controls {
            display: inline-flex;
            align-items: center;
        }

        .show, .summary {
            margin-right: 32px;
        }

        button {
            display: inline-flex;
            align-items: center;
            padding: 0;
            height: auto;
            min-width: 0;
            &[disabled] {
                color: lighten($grey, 25%);
            }
            border-radius: 50%;
        }

        .dropdown {
            margin-left: 5px;
        }

        .item {
            display: block;
        }

        .spacer {
            display: inline-block;
            width: 24px;
        }
    }
</style>
