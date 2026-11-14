// UserAvatar and EmailAddress on avatar.html: a few people as a list row would show them.
import { createApp, h } from "vue";
import EmailAddress from "@ui/EmailAddress.vue";
import UserAvatar from "@ui/UserAvatar.vue";

const people = [
  { name: "Sam Taylor", avatar: null, email: "sam@forma.test" },
  { name: "Grace Hall", avatar: "https://randomuser.me/api/portraits/women/44.jpg", email: "grace.hall@forma.test" },
  { name: "Bartholomew Featherstonehaugh-Smythe", avatar: null, email: "bartholomew.featherstonehaugh-smythe@accounts.forma-industries.test" },
  { name: "Cher", avatar: null, email: "cher@forma.test" },
];

createApp({
  render: () =>
    h("ul", { class: "grid max-w-sm gap-3" }, people.map((person) =>
      h("li", { class: "flex items-start gap-3" }, [
        h(UserAvatar, { user: person }),
        h("div", { class: "min-w-0" }, [
          h("p", { class: "font-medium wrap-anywhere" }, person.name),
          h("p", { class: "text-sm wrap-anywhere muted" }, [h(EmailAddress, { email: person.email })]),
        ]),
      ]))),
}).mount("#user-avatar");
