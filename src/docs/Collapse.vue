<template>
    <div class="view">
        <div class="heading">
            <h1>Collapse</h1>
        </div>

        <div class="card">
            <div class="list divided">
                <div class="item">
                    <ui-collapse label="Collapse 1">
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. A accusantium, alias aliquam at earum fugit impedit iste labore laboriosam neque numquam omnis quaerat quia quibusdam ratione saepe sequi vero voluptas!
                    </ui-collapse>
                </div>
                <div class="item">
                    <ui-collapse>
                        <template slot="label">Collapse 2 &ndash; Label is slot to allow html <i class="success-colour">sentiment_very_satisfied</i></template>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Asperiores at eaque facere harum impedit incidunt itaque magni maxime molestias nesciunt, nulla perferendis quaerat quia quibusdam quos rerum saepe veritatis voluptas.</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Asperiores at eaque facere harum impedit incidunt itaque magni maxime molestias nesciunt, nulla perferendis quaerat quia quibusdam quos rerum saepe veritatis voluptas.</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Asperiores at eaque facere harum impedit incidunt itaque magni maxime molestias nesciunt, nulla perferendis quaerat quia quibusdam quos rerum saepe veritatis voluptas.</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Asperiores at eaque facere harum impedit incidunt itaque magni maxime molestias nesciunt, nulla perferendis quaerat quia quibusdam quos rerum saepe veritatis voluptas.</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Asperiores at eaque facere harum impedit incidunt itaque magni maxime molestias nesciunt, nulla perferendis quaerat quia quibusdam quos rerum saepe veritatis voluptas.</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Asperiores at eaque facere harum impedit incidunt itaque magni maxime molestias nesciunt, nulla perferendis quaerat quia quibusdam quos rerum saepe veritatis voluptas.</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Asperiores at eaque facere harum impedit incidunt itaque magni maxime molestias nesciunt, nulla perferendis quaerat quia quibusdam quos rerum saepe veritatis voluptas.</p>
                    </ui-collapse>
                </div>
                <div class="item">
                    <ui-collapse label="Collapse 3" opened>
                        <p>Open by default with <code>opened</code> attribute.</p>
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aperiam aspernatur autem consectetur cumque cupiditate delectus deleniti ducimus eos, est et eveniet iste, non nostrum quia quo sed temporibus vitae voluptas?
                        </p>
                    </ui-collapse>
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