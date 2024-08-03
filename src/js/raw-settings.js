/* global CodeMirror, uDom, uBlockDashboard */

'use strict';


{
	const cmEditor = new CodeMirror(
		document.getElementById('rawSettings'),
		{
			autofocus: true,
			lineNumbers: true,
			lineWrapping: true,
			styleActiveLine: true
		}
	);

	uBlockDashboard.patchCodeMirrorEditor(cmEditor);

	let cachedData = '';

	const hashFromRawSettings = function (raw) {
		return raw.trim().replace(/\s+/g, '|');
	};

	// This is to give a visual hint that the content of user blacklist has changed.

	const rawSettingsChanged = (() => {
		let timer;

		const handler = function () {
			timer = undefined;
			const changed =
				hashFromRawSettings(cmEditor.getValue()) !== cachedData;
			uDom.nodeFromId('rawSettingsApply').disabled = changed === false;
			CodeMirror.commands.save = changed ? applyChanges : function () { };
		};

		return function () {
			if (timer !== undefined) {
				clearTimeout(timer);
			}
			timer = vAPI.setTimeout(handler, 100);
		};
	})();

	cmEditor.on('changes', rawSettingsChanged);

	const renderRawSettings = async function (first) {
		const raw = await vAPI.messaging.send('dashboard', {
			what: 'readRawSettings'
		});
		cachedData = hashFromRawSettings(raw);
		const lines = raw.split('\n');
		const n = lines.length;
		let max = 0;
		for (let i = 0; i < n; i++) {
			const pos = lines[i].indexOf(' ');
			if (pos > max) { max = pos; }
		}
		const pretty = [];
		for (let i = 0; i < n; i++) {
			const pos = lines[i].indexOf(' ');
			pretty.push(' '.repeat(max - pos) + lines[i]);
		}
		pretty.push('');
		cmEditor.setValue(pretty.join('\n'));
		if (first) {
			cmEditor.clearHistory();
		}
		rawSettingsChanged();
		cmEditor.focus();
	};

	const applyChanges = async function () {
		await vAPI.messaging.send('dashboard', {
			what: 'writeRawSettings',
			content: cmEditor.getValue(),
		});
		renderRawSettings();
	};

	// Handle user interaction
	uDom('#rawSettings').on('input', rawSettingsChanged);
	uDom('#rawSettingsApply').on('click', applyChanges);

	renderRawSettings(true);
}