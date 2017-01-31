<template>
    <div class="view">
        <div class="heading">
            <h1>Forms</h1>
        </div>

        <div class="card">
            <form>
                <p>Available attributes include:</p>
                <ui-field label="Text input">
                    <input type="text" v-model="text">
                </ui-field>
                <ui-input type="text" v-model="text" label="Input with placeholder" placeholder="Enter your name"></ui-input>
                <ui-input type="email" v-model="email" label="Email input"></ui-input>
                <ui-input type="number" v-model="number" label="Number input" min="2" max="5"></ui-input>
                <ui-input type="text" v-model="disabled" label="Disabled input" disabled></ui-input>
                <ui-input type="text" v-model="required" label="Required input" required></ui-input>
                <ui-input type="text" v-model="hint" label="Input with hint" hint="Hints can be set as an attribute or slot in a template tag" required></ui-input>
                <ui-input type="text" v-model="maxlength" label="Input with maxlength" hint="Maxlenght attribute automatically adds a counter" maxlength="20"></ui-input>

                <h2>Component Inputs</h2>
                <ui-date v-model="date"></ui-date>

                <h2>Selects</h2>
                <ui-select v-model="select" label="Select" :options="options" placeholder="Please select..."></ui-select>
                <ui-select-multiple v-model="multiple" label="Select Multiple" :options="options" final-separator="&" placeholder="Please select..." help="Right click for context menu"></ui-select-multiple>
                <!--<h2>Toggles</h2>-->
                <!--<ui-checkbox v-model="checkbox" label="Check me!" inline></ui-checkbox>-->
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
                disabled: 'Disabled input',
                required: null,
                hint: null,
                maxlength: null,
                checkbox: false,
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
        }
    }
</script>