<template>
    <div class="data">
        <div class="toolbar" v-if="searchable">
            <div class="title"><slot name="title"></slot></div>
            <div class="actions">
                <ui-search v-if="searchable"
                           v-model="search"
                           @input="page = 1">
                </ui-search>
            </div>
        </div>

        <div v-if="table" class="responsive">
            <table :class="classes">
                <thead>
                    <slot name="headers" ref="headers"></slot>
                </thead>
                <tbody>
                    <slot v-for="item in paginated" :item="item"></slot>
                </tbody>
            </table>
        </div>

        <div v-if="list" class="list" :class="classes">
            <slot name="headers" ref="headers"></slot>
            <slot v-for="item in paginated" :item="item"></slot>
        </div>

        <ui-loader :loading="loading"></ui-loader>

        <div class="empty" v-if="!loading && filtered && filtered.length === 0">
            <slot name="empty">No records available</slot>
        </div>

        <ui-pagination v-if="paginate"
                       v-model="page"
                       :items="filtered.length"
                       :simple="simple"
                       :display="paginationDisplay"
                       @change="display = arguments[0]">
        </ui-pagination>
    </div>
</template>

<script>
    import UiDropdown from './Dropdown.vue';
    import UiPagination from './Pagination.vue';
    import UiSearch from './Search.vue';
    import UiLoader from './Loader.vue';

    export default {
        props: {
            items: Array,
            list: Boolean,
            table: Boolean,
            loading: Boolean,
            classes: String,
            searchable: Array,
            sort: String,
            order: {
                default: 'asc'
            },
            paginate: Boolean,
            simple: Boolean,
            options: Array,
            display: {
                default: 15
            }
        },

        computed: {
            sorted() {
                if (this.sorting) {
                    return this.items.sort((a, b) => {
                        let current = this.ordering === 'asc' ? a[this.sorting] : b[this.sorting];
                        let next = this.ordering === 'asc' ? b[this.sorting] : a[this.sorting];

                        if (typeof current === 'string' || current instanceof String) {
                            current = current.toLowerCase();
                        }
                        if (typeof next === 'string' || next instanceof String) {
                            next = next.toLowerCase();
                        }

                        if (current < next) {
                            return -1;
                        } else if (current > next) {
                            return 1;
                        }
                        return 0;
                    });
                } else {
                    return this.items;
                }
            },

            filtered() {
                if (this.searchable && this.search.length > 0) {
                    return this.sorted.filter(item => {
                        if (this.searchable.length === 1) {
                            return String(item[this.searchable[0]]).toLowerCase().indexOf(this.search.toLowerCase()) > -1
                        } else {
                            return this.searchable.some(key => {
                                return String(item[key]).toLowerCase().indexOf(this.search.toLowerCase()) > -1
                            });
                        }
                    });
                } else {
                    return this.sorted;
                }
            },

            paginated() {
                if (this.paginate) {
                    const start = (this.page - 1) * this.paginationDisplay;

                    return this.filtered.slice(start, this.page * this.paginationDisplay);
                } else {
                    return this.filtered;
                }
            }
        },

        data() {
            return {
                search: '',
                page: 1,
                paginationDisplay: false,
                sorting: null,
                ordering: 'asc'
            }
        },

        created() {
            if (this.paginate) {
                this.paginationDisplay = this.display;
            }
            if (this.sort) {
                this.sorting = this.sort;
            }
            this.ordering = this.order;
        },

        mounted() {
            Array.from(this.$el.querySelectorAll('[data-sort]')).forEach(s => {
                s.classList.add('sortable');
                s.addEventListener('click', this.onSort);
                if (s.dataset.sort === this.sorting) {
                    s.classList.add(this.ordering);
                }
            });
        },

        components: {
            UiDropdown, UiPagination, UiSearch, UiLoader
        },

        methods: {
            onSort(e) {
                Array.from(this.$el.querySelectorAll('[data-sort]')).forEach(s => {
                    s.classList.remove('asc');
                    s.classList.remove('desc');
                });

                const sorting = e.target.dataset.sort;

                if (sorting === this.sorting) {
                    this.ordering = this.ordering === 'asc' ? 'desc' : 'asc';
                } else {
                    this.ordering = 'asc';
                }

                e.target.classList.add(this.ordering);
                this.sorting = sorting;
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    .data {
        .list, table {
            margin-bottom: 0;
            padding-bottom: 0;
        }

        .pagination {
            border-top: 1px solid var(--divider);
            padding: 16px 24px;
        }

        .empty {
            padding: 24px 0;
            text-align: center;
        }

        .sortable {
            cursor: pointer;
        }

        .asc:after, .desc:after {
            @include icon;
            font-size: 16px;
            margin-left: 2px;
            content: 'arrow_upward';
            transform: translate(0, 3px);
        }
        .desc:after {
            content: 'arrow_downward';
        }
    }

</style>
