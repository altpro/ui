<template>
    <div class="field" :class="{ 'focus': focus }">
        <label :for="computedId"><slot name="label">{{ label }}</slot></label>
        <div class="input" :class="{ 'focus': focus }">
            <textarea
                    v-model="content"
                    :name="name"
                    :id="computedId"
                    :maxlength="maxlength"
                    :placeholder="placeholder"
                    @input="onInput"
                    @focus="focus = true"
                    @blur="focus = false"
            ></textarea>
        </div>
        <div class="help" v-if="help || maxlength"><span>{{ help }}<slot name="help"></slot></span><span class="counter" v-if="maxlength">{{ value ? value.length : 0 }}/{{ maxlength }}</span></div>
    </div>
</template>

<script>
    export default {
        props: {
            label: String,
            name: String,
            id: String,
            value: null,
            maxlength: [String, Number],
            placeholder: String,
            help: String
        },

        data() {
            return {
                content: '',
                focus: false,
                randomId: 'input-' + Math.random()
            }
        },

        computed: {
            computedId() {
                return this.id ? this.id : this.randomId;
            }
        },

        created() {
            this.content = this.value;
        },

        methods: {
            onInput(event) {
                this.$emit('input', event.target.value)
            }
        }
    }
</script>
