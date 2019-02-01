const isChainable = (doclet) => doclet && doclet.comment.indexOf('chainable') >= 0;
const isClassMember = ({kind}) => (kind === 'member' || kind === 'function');
const injected = (doclet) => [doclet.longname, doclet.name];

// const has = (doclet, tag) => doclet.comment.indexOf('@' + tag) >= 0

let tagLookup = {};
const matchLookup = (tag) => Object.keys(tagLookup)
    .sort(
        (a, b) => b.length - a.length
    )
    .filter(
        (lookup) => tag.indexOf(lookup) === 0
    );

const getLookupType = (type) => {
    const outtype = Object
        .entries(tagLookup)
        .reduce(
            (current, [_to, {longname: _from}]) => {
                return current.replace(_from, _to)
            },
            type
        );

    return outtype;
};

const replaceNames = {};

exports.handlers = {
    parseBegin() {
        tagLookup = {};
    },
    newDoclet({doclet}) {

        if (!doclet.undocumented && doclet.memberof === 'module:scramjet') {
            injected(doclet)
                .reduce(
                    (acc, symbol) => tagLookup[symbol] = doclet,
                    null
                );
        }

        if (tagLookup[doclet.longname]) {
            doclet.name = tagLookup[doclet.longname].name;
            doclet.memberof = tagLookup[doclet.longname].memberof;
            doclet.longname = tagLookup[doclet.longname].longname;
        }

        if (doclet.augments) {
            let replaced = 0;
            const oldAugments = doclet.augments;
            doclet.augments = oldAugments.map(
                augmented => matchLookup(augmented).map(
                    lookup => (replaced++, augmented.replace(lookup, tagLookup[lookup].longname))
                )
            );
            if (replaced && doclet.kind === 'class') {
                const oldName = doclet.name;
                doclet.name = `${oldName} extends ${oldAugments[0]}`;
                replaceNames[oldName] = doclet.name;
            }
        }

        if (doclet.memberof) {
            matchLookup(doclet.memberof)
                .forEach(
                    (lookup) => {
                        doclet.longname = doclet.longname.replace(lookup, tagLookup[lookup].longname)
                        doclet.memberof = doclet.memberof.replace(lookup, tagLookup[lookup].longname)
                    }
                );
        }

        if (!doclet.returns && isClassMember(doclet)) {
            if (doclet.async) {
                if (!doclet.returns) doclet.returns = [{type: {names: ["Promise"]}}];
                else doclet.returns = doclet.returns && doclet.returns.forEach(
                    x => x.type.names = x.type.names.map(name => `Promise<${name}>`)
                );
            } else if (isChainable(doclet)) {
                doclet.returns = [{type: {names: [getLookupType(doclet.memberof)]}}];
            }
        }
    },
    parseComplete({doclets}) {
        doclets.forEach(
            doclet => {
                const memberof = doclet.memberof;
                if (!memberof) return;

                const replacement = Object.entries(replaceNames).find(
                    ([key]) => {
                        const match = memberof.indexOf(key);

                        if (match === -1) return false;
                        if (match === 0) return true;
                        if (memberof[match - 1] === '.') return true;

                        return false;
                    }
                );

                if (replacement) {
                    doclet.memberof = doclet.memberof.replace(replacement[0], replacement[1])
                }
            }
        )
    }
};

