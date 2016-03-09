function el(tag, props) {
	return {_: tag, ...props};
}

const visitor = {
	primitiveValue: ({value}) => el("primitiveValue", {value}),
	unit: () => null,
	html: () => null,
	select: ({label, value, detail}) => el("select", {label, value, detail: transform(detail)}),
	either: ({choice, detail}) => el("choice", {choice, detail: transform(detail)}),
	group: ({members}) => el("group", {members: members.map(({name, node}) => ({name, value: transform(node)}))}),
	labeled: ({label, inner}) => el("labeled", {label, inner: transform(inner)}),
	table: ({columns, rows}) => el("table", {columns, rows: rows.map(r => transform(r).members)}),
	validation: ({inner}) => transform(inner),
	toc: ({inner}) => transform(inner),
	workbench: ({inner}) => transform(inner),
	unimplemented: node => {
		throw `No JSON representation implemented for class '${node.constructor.name}'.`;
	},
};

function transform(node) {
	return node == undefined ? node : node.visit(visitor);
}

export default transform;
