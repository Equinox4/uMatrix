'use strict';


µMatrix.changeUserSettings = function (name, value) {
	if (typeof name !== 'string' || name === '') {
		return;
	}

	// Do not allow an unknown user setting to be created
	if (this.userSettings[name] === undefined) {
		return;
	}

	if (value === undefined) {
		return this.userSettings[name];
	}

	// Pre-change
	switch (name) {

		default:
			break;
	}

	// Change
	this.userSettings[name] = value;

	// Post-change
	switch (name) {
		case 'autoUpdate':
			this.scheduleAssetUpdater(value === true ? 120000 : 0);
			break;
		default:
			break;
	}

	this.saveUserSettings();
};