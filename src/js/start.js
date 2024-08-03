'use strict';


(async () => {
	const µm = µMatrix;

	await Promise.all([
		µm.loadRawSettings(),
		µm.loadUserSettings(),
	]);
	log.info(`User settings ready ${Date.now() - vAPI.T0} ms after launch`);

	const cacheBackend = await µm.cacheStorage.select(
		µm.rawSettings.cacheStorageAPI
	);
	log.info(`Backend storage for cache will be ${cacheBackend}`);

	const shouldWASM =
		vAPI.canWASM === true &&
		µm.rawSettings.disableWebAssembly !== true;
	if (shouldWASM) {
		await Promise.all([
			µm.HNTrieContainer.enableWASM(),
			self.publicSuffixList.enableWASM(),
		]);
		log.info(`WASM modules ready ${Date.now() - vAPI.T0} ms after launch`);
	}

	await µm.loadPublicSuffixList();
	log.info(`PSL ready ${Date.now() - vAPI.T0} ms after launch`);

	{
		let trieDetails;
		try {
			trieDetails = JSON.parse(
				vAPI.localStorage.getItem('ubiquitousBlacklist.trieDetails')
			);
		} catch (ex) {
		}
		µm.ubiquitousBlacklist = new µm.HNTrieContainer(trieDetails);
		if (shouldWASM) {
			µm.ubiquitousBlacklist.initWASM();
		}
	}
	log.info(`Ubiquitous block rules container ready ${Date.now() - vAPI.T0} ms after launch`);

	await Promise.all([
		µm.loadMatrix(),
		µm.loadHostsFiles(),
	]);
	log.info(`All rules ready ${Date.now() - vAPI.T0} ms after launch`);

	{
		const pageStore =
			µm.pageStoreFactory(µm.tabContextManager.mustLookup(vAPI.noTabId));
		pageStore.title = vAPI.i18n('statsPageDetailedBehindTheScenePage');
		µm.pageStores.set(vAPI.noTabId, pageStore);
	}

	const tabs = await vAPI.tabs.query({ url: '<all_urls>' });
	if (Array.isArray(tabs)) {
		for (const tab of tabs) {
			µm.tabContextManager.push(tab.id, tab.url, 'newURL');
			µm.bindTabToPageStats(tab.id);
			µm.setPageStoreTitle(tab.id, tab.title);
		}
	}
	log.info(`Tab stores ready ${Date.now() - vAPI.T0} ms after launch`);

	µm.webRequest.start();

	µm.loadRecipes();

	// https://github.com/uBlockOrigin/uMatrix-issues/issues/63
	//   Ensure user settings are fully loaded before launching the
	//   asset updater.
	µm.assets.addObserver(µm.assetObserver.bind(µm));
	µm.scheduleAssetUpdater(µm.userSettings.autoUpdate ? 7 * 60 * 1000 : 0);
})();