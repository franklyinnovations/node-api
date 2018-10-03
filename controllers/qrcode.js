'use strict';

const
	qr = require('qr.js');

exports.html = function (str) {
	let {modules: rows} = qr(str), result = '<table class="qrcode"><tbody>';
	for (let i = 0; i < rows.length; i++) {
		result += '<tr>';
		const cells = rows[i];
		for (let j = 0; j < cells.length; j++) {
			result += `<td class="${cells[j] ? 'filled' : 'empty'}"></td>`;
		}
		result += '</tr>';
	}
	result += '</tbody></table>';
	return result;
};