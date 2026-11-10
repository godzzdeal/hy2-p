import { type Plugin } from "postcss";
import selectorParser from "postcss-selector-parser";
import { sourceClasses } from "./sources.ts";

export function styleModules(): Plugin {
  return {
    postcssPlugin: "hy2-style-modules",
    OnceExit(root) {
      root.walkRules((rule) => {
        rule.selector = selectorParser((selectors) => {
          selectors.walkClasses((node) => {
            if (!/^(cm-|epr-)/.test(node.value) || node.parent?.parent?.value === ":global") return;
            const global = selectorParser.pseudo({ value: ":global" });
            const selector = selectorParser.selector({ value: "" });
            selector.append(node.clone());
            global.append(selector);
            node.replaceWith(global);
          });
          selectors.walkIds((node) => {
            node.replaceWith(
              selectorParser.attribute({
                attribute: "id",
                operator: "=",
                value: node.value,
                quoteMark: '"',
                raws: {},
              }),
            );
          });
        }).processSync(rule.selector);
      });
      for (const name of sourceClasses()) {
        const selector = selectorParser.className({ value: "" });
        selector.value = name;
        root.append({ selector: selector.toString(), nodes: [] });
      }
    },
  };
}
