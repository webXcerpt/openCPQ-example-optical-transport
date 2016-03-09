/** @jsx openCPQElement */

import React from "react";
import {renderToStaticMarkup} from "react/lib/ReactServerRendering";

// A tweaked variant of React.createElement adding class "openCPQ" to each element.
function openCPQElement(tag, attrs, ...contents) {
	var {className = "", ...moreAttrs} = attrs || {};
	className = `openCPQ ${className}`;
	attrs = {className, ...moreAttrs};
	return React.createElement(tag, attrs, ...contents);
}

const visitor = {
	boolean: ({value}) => <span className="primitive boolean">{value ? "yes" : "no"}</span>,
	primitiveValue: ({value}) => <span className="primitive">{value}</span>,
	unit: () => undefined,
	html: (html) => html,
	select: ({label, detail}) => <span className="select"><span className="select-item">{label || "(missing)"}{" "}</span>{toVDOM(detail)}</span>,
	either: ({choice, detail}) => <span className="either"><span className="either-choice">{choice ? "yes" : "no"}</span>{toVDOM(detail)}</span>,
	group: ({members}) => {
		// Skip disabled features and unequipped slots:
		members = members.filter(({node}) =>
			node.inner && !(node.inner.value === false || node.inner.value === "B:FP")
		);
		return members.length === 0 ? <span className="select-item">(none)</span> :
			<ul className="group">{
				members.map(({node}) => <li>{
					node.inner && node.inner.value === true
					? <span>
						<span className="select-item">{node.label}</span>
						{ node.inner.detail && toVDOM(node.inner.detail) /* hacky solution for "either" nodes */}
					</span>
					: toVDOM(node)
				}</li>)
			}</ul>;
	},
	labeled: ({label, inner}) => <span className="labeled"><span className="clabel">{label}:</span>{" "}{toVDOM(inner)}</span>,
	table: ({columns, rows}) => <table>
		<colgroup>{columns.map(c => <col className={"col-" + c.name}/>)}</colgroup>
		<thead><tr>{columns.map(c => <th>{c.label}</th>)}</tr></thead>
		<tbody>{
			rows.length === 0 ? <tr colSpan={columns.length}><td>(no entries)</td></tr> :
			rows.map(r => <tr>{columns.map(c => <td>{toVDOM(r.member(c.name))}</td>)}</tr>)
		}</tbody>
	</table>,
	validation: ({inner}) => toVDOM(inner),
	toc: ({inner}) => toVDOM(inner),
	workbench: ({inner}) => toVDOM(inner),
	unimplemented: node => <span className="error">[### no toVDOM visitor given for {node.constructor.name} ###]</span>,
};

function toVDOM(node) {
	return node.visit(visitor);
}

export default node => renderToStaticMarkup(toVDOM(node));
