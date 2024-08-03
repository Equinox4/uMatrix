'use strict';


// Injected into content pages

(() => {

	if (typeof vAPI !== 'object') { return; }

	vAPI.selfWorkerSrcReported = vAPI.selfWorkerSrcReported || false;

	const reGoodWorkerSrc = /(?:child|worker)-src[^;,]+?'none'/;

	const handler = function (ev) {
		if (
			ev.isTrusted !== true ||
			ev.originalPolicy.includes('report-uri about:blank') === false
		) {
			return false;
		}

		// Firefox and Chromium differs in how they fill the
		// 'effectiveDirective' property.
		if (
			ev.effectiveDirective.startsWith('worker-src') === false &&
			ev.effectiveDirective.startsWith('child-src') === false
		) {
			return false;
		}

		// Further validate that the policy violation is relevant to uMatrix:
		// the event still could have been fired as a result of a CSP header
		// not injected by uMatrix.
		if (reGoodWorkerSrc.test(ev.originalPolicy) === false) {
			return false;
		}

		// We do not want to report internal resources more than once.
		// However, we do want to report external resources each time.
		// TODO: this could eventually lead to duplicated reports for external
		//       resources if another extension uses the same approach as
		//       uMatrix. Think about what could be done to avoid duplicate
		//       reports.
		if (ev.blockedURI.includes('://') === false) {
			if (vAPI.selfWorkerSrcReported) { return true; }
			vAPI.selfWorkerSrcReported = true;
		}

		vAPI.messaging.send('contentscript.js', {
			what: 'securityPolicyViolation',
			directive: 'worker-src',
			blockedURI: ev.blockedURI,
			documentURI: ev.documentURI,
			blocked: ev.disposition === 'enforce',
		});

		return true;
	};

	document.addEventListener('securitypolicyviolation', ev => {
		if (!handler(ev)) { return; }
		ev.stopPropagation();
		ev.preventDefault();
	}, true);
})();