const isChainable = (doclet) => doclet && doclet.comment.indexOf("chainable") >= 0;
const isClassMember = ({kind}) => (kind === "member" || kind === "function");
const injected = (doclet) => (doclet.tags || []).filter(({title}) => title === "inject").map(({value}) => value.trim());

let tagLookup = {};

module.exports.handlers = {
    parseBegin() {
        tagLookup = {};
    },
    newDoclet({doclet}) {

        if (doclet.memberof === "module:scramjet") {
            injected(doclet)
                .reduce(
                    (acc, symbol) => tagLookup[symbol] = doclet,
                    null
                ) && (doclet.undocumented = true);
        }

        if (isClassMember(doclet)) {
            if (!doclet.returns && doclet.async) {
                doclet.returns = [{type: {names: ["Promise<any>"]}}];
            } else if (doclet.returns && doclet.async) {
                doclet.returns = doclet.returns.map(({type}) => {
                    return {type: {names: type.names.map(
                        name => name.startsWith("Promise<")
                            ? name
                            : `Promise<${name}>`
                    )}};
                });
            } else if (!doclet.returns && isChainable(doclet)) {
                doclet.returns = [{type: {names: ["this"]}}];
            }
        }
    }
};

