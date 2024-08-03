/* exported uMatrixScopeWidget */
/* global punycode */

'use strict';


let uMatrixScopeWidget = (function () {

	let currentScope = '';
	let listening = false;

	let fireChangeEvent = function () {
		document.body.setAttribute('data-scope', currentScope);
		let ev = new CustomEvent(
			'uMatrixScopeWidgetChange',
			{
				detail: { scope: currentScope }
			}
		);
		window.dispatchEvent(ev);
	};

	let init = function (domain, hostname, scope, container) {
		if (typeof domain !== 'string') { return; }

		currentScope = '';

		// Reset widget
		if (!container) {
			container = document;
		}
		let specificScope = container.querySelector('#specificScope');
		while (specificScope.firstChild !== null) {
			specificScope.removeChild(specificScope.firstChild);
		}

		// Fill in the scope menu entries
		let pos = domain.indexOf('.');
		let tld, labels;
		if (pos === -1) {
			tld = '';
			labels = hostname;
		} else {
			tld = domain.slice(pos + 1);
			labels = hostname.slice(0, -tld.length);
		}
		let beg = 0;
		while (beg < labels.length) {
			pos = labels.indexOf('.', beg);
			if (pos === -1) {
				pos = labels.length;
			} else {
				pos += 1;
			}
			let label = document.createElement('span');
			label.appendChild(
				document.createTextNode(punycode.toUnicode(labels.slice(beg, pos)))
			);
			let span = document.createElement('span');
			span.setAttribute('data-scope', labels.slice(beg) + tld);
			span.appendChild(label);
			specificScope.appendChild(span);
			beg = pos;
		}
		if (tld !== '') {
			let label = document.createElement('span');
			label.appendChild(document.createTextNode(punycode.toUnicode(tld)));
			let span = document.createElement('span');
			span.setAttribute('data-scope', tld);
			span.appendChild(label);
			specificScope.appendChild(span);
		}

		if (listening === false) {
			container.querySelector('#specificScope').addEventListener(
				'click',
				ev => { update(ev.target.getAttribute('data-scope')); }
			);
			container.querySelector('#globalScope').addEventListener(
				'click',
				() => { update('*'); }
			);
			listening = true;
		}

		update(scope || hostname, container);
	};

	let getScope = function () {
		return currentScope;
	};

	let update = function (scope, container) {
		if (scope === currentScope) { return; }
		currentScope = scope;
		if (!container) {
			container = document;
		}
		let specificScope = container.querySelector('#specificScope'),
			isGlobal = scope === '*';
		specificScope.classList.toggle('on', !isGlobal);
		container.querySelector('#globalScope').classList.toggle('on', isGlobal);
		for (let node of specificScope.children) {
			node.classList.toggle(
				'on',
				!isGlobal &&
				scope.endsWith(node.getAttribute('data-scope'))
			);
		}
		fireChangeEvent();
	};

	return { init, getScope, update };
})();