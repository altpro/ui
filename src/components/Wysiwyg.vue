<template>
    <div class="field" :class="{ 'focus': focus }">
        <label :for="computedId" style="margin-bottom: 5px">{{ label }}<slot name="label"></slot></label>
        <div class="input" :class="{ 'focus': focus }">
            <textarea :name="name" :value="value" ref="editor"></textarea>
        </div>
        <div class="help"><span>{{ help }}<slot name="help"></slot></span></div>
    </div>
</template>


<script>
    module.exports = {

        data() {
            return {
                editor: null,
                focus: false
            }
        },

        props: {
            label: String,
            name: String,
            id: String,
            help: String,
            value: {
                type: String,
                required: false
            },
        },

        computed: {
            computedId() {
                return this.id ? this.id : this.randomId;
            }
        },

        mounted: function() {
            this.editor = CKEDITOR.replace(this.$refs.editor);
            const vm = this;

            this.editor.on('focus', function() {
                vm.focus = true;
            });
            this.editor.on('blur', function() {
                vm.focus = false;
            });

            this.editor.on('change', function(e) {
                vm.$emit('input', this.getData())
            });
        },

        beforeDestroy: function () {
            this.editor.destroy();
        }
    };

</script>