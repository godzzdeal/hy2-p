import ts from "typescript";
import selectorParser from "postcss-selector-parser";

type TClassNames = Readonly<Record<string, string>>;
const SELECTOR_METHODS = new Set(["locator", "querySelector", "querySelectorAll", "closest", "matches"]);
const TOKEN_METHODS = new Set(["add", "remove", "toggle", "contains", "replace"]);

function renameSelector(value: string, names: TClassNames): string {
  if (!value.includes(".") || /^(xpath|text|role)=/.test(value)) return value;
  return selectorParser((selectors) => {
    selectors.walkClasses((node) => {
      if (names[node.value]) node.value = names[node.value];
    });
  }).processSync(value);
}
function renameTokens(value: string, names: TClassNames): string {
  return value
    .split(/\s+/)
    .map((token) => names[token] ?? token)
    .join(" ");
}
export function transformTest(source: ts.SourceFile, names: TClassNames): string {
  const result = ts.transform(source, [
    (context) => {
      const visit: ts.Visitor = (node) => {
        if (
          ts.isRegularExpressionLiteral(node) &&
          ts.isCallExpression(node.parent) &&
          ts.isPropertyAccessExpression(node.parent.expression) &&
          node.parent.expression.name.text === "toHaveClass"
        ) {
          const match = /^\/([\w-]+)\/(\w*)$/.exec(node.text);
          if (match && names[match[1]])
            return ts.factory.createRegularExpressionLiteral("/" + names[match[1]] + "/" + match[2]);
        }
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
          const parent = node.parent;
          let value = node.text;
          if (ts.isCallExpression(parent) && ts.isPropertyAccessExpression(parent.expression)) {
            const method = parent.expression.name.text;
            if (parent.arguments[0] === node && SELECTOR_METHODS.has(method))
              value = renameSelector(value, names);
            else if (
              TOKEN_METHODS.has(method) &&
              parent.expression.expression.getText(source).endsWith(".classList")
            )
              value = renameTokens(value, names);
          } else if (
            ts.isBinaryExpression(parent) &&
            parent.right === node &&
            ts.isPropertyAccessExpression(parent.left) &&
            parent.left.name.text === "className"
          )
            value = renameTokens(value, names);
          if (value !== node.text) return ts.factory.createStringLiteral(value);
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (file) => ts.visitNode(file, visit) as ts.SourceFile;
    },
  ]);
  try {
    return ts.createPrinter().printFile(result.transformed[0]);
  } finally {
    result.dispose();
  }
}
