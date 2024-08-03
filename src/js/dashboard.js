/* global uDom */

'use strict';


{
	const loadDashboardPanel = function (hash) {
		const button = uDom(hash);
		const url = button.attr('data-dashboard-panel-url');
		uDom('iframe').attr('src', url);
		uDom('.tabButton').forEach(function (button) {
			button.toggleClass(
				'selected',
				button.attr('data-dashboard-panel-url') === url
			);
		});
	};

	const onTabClickHandler = function () {
		loadDashboardPanel(window.location.hash);
	};

	uDom.onLoad(function () {
		window.addEventListener('hashchange', onTabClickHandler);
		let hash = window.location.hash;
		if (hash.length < 2) {
			hash = '#settings';
		}
		loadDashboardPanel(hash);
	});
}