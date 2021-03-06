// MIT © 2017 azu
"use strict";
const isSourceAlmin = source => {
    if (!source) {
        return false;
    }
    return source.type === "Literal" && source.value === "almin";
};
const isChangedPayload = source => {
    if (!source) {
        return false;
    }
    return source.type === "Identifier" && source.name === "ChangedPayload";
};
/**
 * If found { ChangedPayload }, return ImportSpecifier
 * @param path
 * @returns {boolean}
 */
const isChangedPayloadImportSpecifier = path => {
    if (!path.node) {
        return false;
    }
    if (path.node.type !== "ImportSpecifier") {
        return false;
    }
    // from "almin"
    const parent = path.parent;
    if (!isSourceAlmin(parent.node.source)) {
        return false;
    }
    // import { ChangedPayload }
    return isChangedPayload(path.node.imported);
};

function isNewExpressionChangedPayload(path) {
    const node = path.node;
    if (!node || node.type !== "NewExpression") {
        return false;
    }
    const expression = node;
    return (
        expression &&
        expression.type === "NewExpression" &&
        expression.callee &&
        expression.callee.type === "Identifier" &&
        expression.callee.name === "ChangedPayload"
    );
}

module.exports = function transformer(file, api) {
    const j = api.jscodeshift;
    let hasAlmin = false;
    return (
        j(
            // Remove `import { ChangedPayload } from "almin"
            j(file.source)
                .find(j.ImportSpecifier)
                .filter(path => {
                    hasAlmin = isChangedPayloadImportSpecifier(path);
                    return hasAlmin;
                })
                .remove()
                .toSource()
        )
            // Rewrite new ChangedPayload() => { type: "ChangedPayload" }
            .find(j.NewExpression)
            .filter(path => {
                if (!hasAlmin) {
                    return false;
                }
                return isNewExpressionChangedPayload(path);
            })
            .replaceWith(path => {
                return `{ type: "ChangedPayload" }`;
            })
            .toSource()
    );
};
