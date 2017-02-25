<template>
    <div class="view">
        <div class="heading">
            <h1>Data</h1>
        </div>

        <div class="card component">
            <ui-data table
                     classes="striped"
                     :items="items"
                     :loading="loading"
                     :searchable="['title', 'user']"
                     sort="comments"
                     order="desc"
                     paginate>
                <h2 slot="title">Vue.js Issues</h2>
                <tr slot="headers">
                    <th data-sort="title">Title</th>
                    <th data-sort="user">User</th>
                    <th>State</th>
                    <th data-sort="comments" class="right">Comments</th>
                </tr>
                <template scope="props">
                    <tr class="item">
                        <td>{{ props.item.title }}</td>
                        <td>{{ props.item.user }}</td>
                        <td>{{ props.item.state }}</td>
                        <td class="right">{{ props.item.comments }}</td>
                    </tr>
                </template>
            </ui-data>
        </div>
    </div>
</template>

<script>
    import axios from 'axios';

    export default {
        data() {
            return {
                items: [],
                loading: true,
            }
        },

        created() {
            axios.get('https://api.github.com/repos/vuejs/vue/issues').then(response => {
                this.loading = false;
                this.items = response.data.map(issue => {
                    return {
                        title: issue.title,
                        user: issue.user.login,
                        state: issue.state,
                        comments: issue.comments
                    }
                });
            }).catch(data => {
                this.loading = false;
                console.log(data);
            });
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";



</style>