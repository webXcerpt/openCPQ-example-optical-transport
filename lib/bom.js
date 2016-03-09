var React = require("react");
var openCPQ = require("opencpq");
var {ButtonGroup, Button, Glyphicon, Table} = require("react-bootstrap");
var $ = require("jquery");
var Baby = require("babyparse");
var saveAs = require("browser-filesaver");

class BOMView {
	constructor(name, bom) {
		this.name = name;
		this.__bom = bom;
	}
	render() {
		return <ReactBom bom={this.__bom}/>
	}
}

var ReactBom = React.createClass({
	getInitialState() {
		return {itemMap: {}};
	},
	componentDidMount() {
		$.ajax({
			url: "resources/materials.tsv",
			success: string => {
				Baby.parse(string, {
					complete: ({data}) => {
						var itemMap = {};
						data.forEach(line => {
							var length = line.length;
							if (length > 0)
								itemMap[line[0]] = {label: length > 1 ? line[1] : undefined, price: length > 2 ? line[2] : undefined};
						});
						this.setState({itemMap});
					},
					fastMode: true,
					skipEmptyLines: true,
					comments: "#"
				});
			}
		});
	},
    exportCSV() {
        var csv = [];
        this.props.bom.mapItems(
            (item, quantity) => {
                var entry = this.state.itemMap[item];
                var label = entry == undefined ? "" : entry.label;
                var price = entry == undefined ? "" : entry.price;
			    var parsedPrice = parseFloat(price);
			    if (!isNaN(parsedPrice))
			    	price = parsedPrice.toLocaleString([], {localeMatcher: "lookup", minimumFractionDigits: 2, maximumFractionDigits: 2});
                csv.push(openCPQ.csvLine([quantity, item, label, price])); // TODO use Baby.unparse
            });
        var blob = new Blob(csv, {type: "text/csv;charset=utf-8"});
        saveAs(blob, "openCPQ.csv");
    },
	render() {
		var accumulatedPrice = 0;
		return <div>
			<ButtonGroup>
				<Button onClick={() => this.exportCSV()}><Glyphicon glyph="th"/> export as CSV</Button>
			</ButtonGroup>
			<Table className="bom">
				<colgroup>
					<col className="bom-col-quantity"/>
					<col className="bom-col-item"/>
					<col className="bom-col-description"/>
					<col className="bom-col-price"/>
					<col className="bom-col-price"/>
				</colgroup>
			<thead>
				<tr>
					<th className="bom-quantity-head">#</th>
					<th className="bom-item-head">Material No.</th>
					<th className="bom-description-head">Description</th>
					<th className="bom-price-head">Unit Price (€)</th>
					<th className="bom-price-head">Price (€)</th>
				</tr>
			</thead>
			<tbody>
				{this.props.bom.empty() ?
				 <tr><td colSpan={5}>
					 <div className="validate validate-info">(no entries)</div>
				 </td></tr> :
				 this.props.bom.mapItems(
					 (item, quantity) => {
						 var entry = this.state.itemMap[item];
						 var label = entry == undefined ? "(missing)" : entry.label;
						 var price = entry == undefined ? "(missing)" : entry.price;
						 var parsedPrice = parseFloat(price);
						 var multipliedPrice = "(missing)";
						 if (!isNaN(parsedPrice)) {
							 price = formatPrice(parsedPrice);
							 const multipliedPrice2 = quantity * parsedPrice;
							 multipliedPrice = formatPrice(multipliedPrice2);
							 accumulatedPrice = accumulatedPrice + multipliedPrice2;
						 }
						 return <tr>
							 <td className="bom-quantity">{quantity}</td>
							 <td className="bom-item">{item}</td>
							 <td className="bom-description">{label}</td>
							 <td className="bom-price">{price}</td>
							 <td className="bom-price">{formatPrice(multipliedPrice)}</td>
						 </tr>;
					 }
				 )}
				<tr>
					<th colSpan="4">Total</th>
					<th>{formatPrice(storePrice(accumulatedPrice))}</th>
				</tr>
			</tbody>
			</Table>
		</div>;
	}
});

function formatPrice(price) {
	return price.toLocaleString(
		[],
		{
			localeMatcher: "lookup",
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}
	);
}

function VBOM({bom}) {
	return new BOMView("bom", bom);
}

// Hack to access the most recently rendered price.
// TODO Find a cleaner solution.
var price = NaN;
function storePrice(x) {
	price = x;
	return x;
}
function getPrice() {
	return price;
}
//

module.exports = {VBOM, BOMView, getPrice};
