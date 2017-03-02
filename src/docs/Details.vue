<template>
    <div class="view">
        <div class="heading">
            <h1>Details</h1>
        </div>

        <div class="card">
            <p>CSS styling is added for the native html5 <code>details</code> & <code>summary</code> elements</p>
            <div class="list divided">
                <div class="item">
                    <details>
                        <summary>Details 1</summary>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. A accusantium, alias aliquam at earum fugit impedit iste labore laboriosam neque numquam omnis quaerat quia quibusdam ratione saepe sequi vero voluptas!</p>
                    </details>
                </div>
                <div class="item">
                    <details>
                        <summary>Details 2 &ndash; Label is slot to allow html <i class="success-colour">sentiment_very_satisfied</i></summary>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Asperiores at eaque facere harum impedit incidunt itaque magni maxime molestias nesciunt, nulla perferendis quaerat quia quibusdam quos rerum saepe veritatis voluptas.</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Asperiores at eaque facere harum impedit incidunt itaque magni maxime molestias nesciunt, nulla perferendis quaerat quia quibusdam quos rerum saepe veritatis voluptas.</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Asperiores at eaque facere harum impedit incidunt itaque magni maxime molestias nesciunt, nulla perferendis quaerat quia quibusdam quos rerum saepe veritatis voluptas.</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Asperiores at eaque facere harum impedit incidunt itaque magni maxime molestias nesciunt, nulla perferendis quaerat quia quibusdam quos rerum saepe veritatis voluptas.</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Asperiores at eaque facere harum impedit incidunt itaque magni maxime molestias nesciunt, nulla perferendis quaerat quia quibusdam quos rerum saepe veritatis voluptas.</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Asperiores at eaque facere harum impedit incidunt itaque magni maxime molestias nesciunt, nulla perferendis quaerat quia quibusdam quos rerum saepe veritatis voluptas.</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Asperiores at eaque facere harum impedit incidunt itaque magni maxime molestias nesciunt, nulla perferendis quaerat quia quibusdam quos rerum saepe veritatis voluptas.</p>
                    </details>
                </div>
                <div class="item">
                    <details open>
                        <summary>Details 3</summary>
                        <p>Open by default with <code>open</code> attribute.</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aperiam aspernatur autem consectetur cumque cupiditate delectus deleniti ducimus eos, est et eveniet iste, non nostrum quia quo sed temporibus vitae voluptas?</p>
                    </details>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        data() {
            return {

            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";


</style>