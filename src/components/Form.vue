<template>
    <form :action="action" :method="method" @submit.prevent="onSubmit">
        <slot></slot>
        <slot name="actions">
            <button type="submit" class="success" :class="{ loading: processing }" :disabled="processing">
                <slot name="submit">Save</slot>
            </button>
        </slot>
    </form>
</template>

<script>
    export default {
        props: {
            action: {
                type: String,
                default: window.location
            },
            method: {
                type: String,
                default: 'POST',
            },
            data: Object
        },

        data() {
            return {
                processing: false,
            }
        },

        methods: {
            onSubmit() {
                if (this.processing) return;

                this.processing = true;

                const data = this.data ? this.data : new FormData(this.$el);

                axios[this.method](this.action, data)
                    .then(response => {
                        this.$emit('response', response);
                        this.processing = false;
                    })
                    .catch(error => {
                        this.$emit('error', error.response);
                        this.handleError(error);
                        this.processing = false;
                    });
            },

            handleError(error) {
                if (error.response.status === 422) {
                    this.displayErrors(error.response.data);
                }
            },

            displayErrors(errors) {
                Object.keys(errors).forEach(field => {
                    if (this.$parent.$refs.hasOwnProperty(field)) {
                        const error = errors[field].join(' ');
                        this.$parent.$refs[field].setError(error)
                    }
                });
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";


</style>
