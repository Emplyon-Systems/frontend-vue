import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";

describe("Vue Test Utils (smoke)", () => {
  it("monta um componente definido em runtime", () => {
    const Trivial = defineComponent({
      name: "Trivial",
      setup() {
        return () => h("p", { class: "msg" }, "ok");
      },
    });
    const w = mount(Trivial);
    expect(w.find(".msg").text()).toBe("ok");
  });
});
