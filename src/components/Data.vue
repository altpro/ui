<template>
    <div class="data">
        <div class="toolbar" v-if="searchable">
            <div class="title"><slot name="title">T</slot></div>
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
                    <slot name="headers"></slot>
                </thead>
                <tbody>
                    <slot v-for="item in paginated" :item="item"></slot>
                </tbody>
            </table>
        </div>

        <div v-if="list" class="list" :class="classes">
            <slot name="headers"></slot>
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
            classes: null,
            searchable: Array,
            sortable: Array,
            paginate: Boolean,
            simple: Boolean,
            options: Array,
            display: {
                default: 15
            }
        },

        computed: {
            filtered() {
                if (this.searchable && this.search.length > 0) {
                    return this.items.filter(item => {
                        return this.searchable.some(key => {
                            return String(item[key]).toLowerCase().indexOf(this.search) > -1
                        });
                    });
                } else {
                    return this.items;
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
                paginationDisplay: false
            }
        },

        created() {
            if (this.paginate) {
                this.paginationDisplay = this.display;
            }
        },

        components: {
            UiDropdown, UiPagination, UiSearch, UiLoader
        },

        methods: {

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
            border-top: 1px solid $divider;
            padding: 16px 24px;
        }

        .empty {
            padding: 24px 0;
            text-align: center;
        }
    }

</style>
