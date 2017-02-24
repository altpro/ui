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
                     :searchable="['title', 'user.login']"
                     paginate>
                <h2 slot="title">Vue.js Issues</h2>
                <tr slot="headers">
                    <th>Title</th>
                    <th>User</th>
                    <th>State</th>
                    <th class="right">Comments</th>
                </tr>
                <template scope="props">
                    <tr class="item">
                        <td>{{ props.item.title }}</td>
                        <td>{{ props.item.user.login }}</td>
                        <td>{{ props.item.state }}</td>
                        <td class="right">{{ props.item.comments }}</td>
                    </tr>
                </template>
            </ui-data>
        </div>
    </div>
</template>

<script>

    export default {
        data() {
            return {
                items: [],
                loading: true,
            }
        },

        created() {
            fetch('https://api.github.com/repos/vuejs/vue/issues').then(response => {
                return response.json();
            }).then(data => {
                this.loading = false;
                this.items = data;
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