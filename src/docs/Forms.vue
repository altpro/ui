<template>
    <div class="view">
        <div class="heading">
            <h1>Forms</h1>
        </div>

        <div class="card">
            <form method="post" ref="form" @submit.prevent="submit">
                <p>Available attributes include:</p>
                <ui-field label="Text input">
                    <input type="text" v-model="text" name="text">
                </ui-field>

                <!--<ui-input type="text" v-model="text" label="Input with placeholder" placeholder="Enter your name"></ui-input>-->
                <!--<ui-input type="email" v-model="email" label="Email input"></ui-input>-->
                <!--<ui-input type="number" v-model="number" label="Number input" min="2" max="5"></ui-input>-->
                <!--<ui-input type="text" v-model="disabled" label="Disabled input" disabled></ui-input>-->
                <!--<ui-input type="text" v-model="required" label="Required input" required></ui-input>-->
                <!--<ui-input type="text" v-model="hint" label="Input with hint" hint="Hints can be set as an attribute or slot in a template tag" required></ui-input>-->
                <!--<ui-input type="text" v-model="maxlength" label="Input with maxlength" hint="Maxlenght attribute automatically adds a counter" maxlength="20"></ui-input>-->

                <h2>Component Inputs</h2>
                <!--<ui-field label="Date">-->
                    <!--<ui-date v-model="date"></ui-date>-->
                <!--</ui-field>-->

                <h2>Selects</h2>
                <ui-field label="Select">
                    <ui-select v-model="select" name="select" label="Select" :options="options" placeholder="Please select..."></ui-select>
                </ui-field>

                <ui-field label="Select">
                    <ui-select-multiple v-model="multiple" name="multiple[]" label="Select" :options="options" placeholder="Please select..."></ui-select-multiple>
                </ui-field>
                <!--<ui-select-multiple v-model="multiple" label="Select Multiple" :options="options" final-separator="&" placeholder="Please select..." help="Right click for context menu"></ui-select-multiple>-->
                <h2>Toggles</h2>

                <label class="checkbox">
                    <input type="checkbox" value="Jack" v-model="checkedNames">
                    Jack
                </label>
                <label class="checkbox">
                    <input type="checkbox" value="John" v-model="checkedNames">
                    John
                </label>
                <label class="checkbox">
                    <input type="checkbox" value="Mike" v-model="checkedNames">
                    Mike
                </label>
                <br>
                <p>Checked names: {{ checkedNames }}</p>
                <p>
                    <!--<svg version="1.1" class="mdc-checkbox__checkmark"-->
         <!--xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"-->
         <!--xml:space="preserve">-->
      <!--<path class="mdc-checkbox__checkmark__path" fill="none" stroke="white"-->
            <!--d="M1.73,12.91 8.1,19.28 22.79,4.59"/>-->
    <!--</svg>-->
                </p>

                <!--<ui-checkbox v-model="checkbox" label="Check me!" inline></ui-checkbox>-->
                <!--<ui-checkbox v-model="checkbox" label="Check me!" inline></ui-checkbox>-->

                <!--<ui-checkbox v-model="checkbox" label="Check me!"></ui-checkbox>-->
                <!--<ui-checkbox v-model="checkbox" label="Check me!"></ui-checkbox>-->
                <!--<ui-checkbox v-model="checkbox" label="Check me!"></ui-checkbox>-->

                <!--<ui-switch v-model="toggle" label="Switch me!" class="success"></ui-switch>-->
                <!--<ui-switch v-model="toggle" label="Switch me!"></ui-switch>-->
                <!--<ui-switch v-model="toggle" label="Switch me!"></ui-switch>-->

                <!--<h2>WYSIWYG</h2>-->
                <!--&lt;!&ndash;<ui-wysiwyg v-model="html" label="Content"></ui-wysiwyg>&ndash;&gt;-->
                <button class="button primary">Submit</button>
            </form>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                text: null,
                email: null,
                number: null,
                disabled: false,
                required: null,
                hint: null,
                checkbox: false,
                checkedNames: [],
                radio: null,
                date: null,
                toggle: false,
                select: null,
                html: null,
                multiple: null,
                options: [
                    {value: 1, name: 'Option 1'},
                    {value: 2, name: 'Option 2'},
                    {value: 3, name: 'Option 3'},
                    {value: 4, name: 'Option 4'},
                    {value: 5, name: 'Option 5'},
                    {value: 6, name: 'Option 6'},
                    {value: 7, name: 'Option 7'},
                    {value: 8, name: 'Option 8'},
                    {value: 9, name: 'Option 9'},
                    {value: 10, name: 'Option 10'}
                ]
            }
        },

        methods: {
            submit() {
                const form = new FormData(this.$refs.form);
                console.table(Array.from(form.entries()));
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    .checkbox {
        display: flex;
        font-size: 16px;
        line-height: 32px;
        padding: 0;
        color: $text;

        input {
            position: relative;
            color: inherit;
            width: 0;
            height: 0;
            margin-right: 26px;

            &:before {
                position: absolute;
                top: 2px;
                left: 0;
                font-family: 'Material Icons';
                font-weight: normal;
                font-style: normal;
                font-size: 20px;
                display: inline-block;
                width: 1em;
                height: 1em;
                line-height: 1;
                text-transform: none;
                letter-spacing: normal;
                word-wrap: normal;
                white-space: nowrap;
                direction: ltr;
                -webkit-font-smoothing: antialiased;
                text-rendering: optimizeLegibility;
                -moz-osx-font-smoothing: grayscale;
                font-feature-settings: 'liga';
                content: 'check_box_outline_blank';
            }

            &:checked:before {
                content: 'check_box';
                color: $primary;
            }
        }
    }

</style>