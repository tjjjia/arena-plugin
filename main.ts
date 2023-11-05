import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, requestUrl, RequestUrlParam, Setting, WorkspaceLeaf } from 'obsidian';

interface ArenaPluginSettings {
	storeInfo: false;
	arenaAccessToken: string;
}

const DEFAULT_SETTINGS: ArenaPluginSettings = {
	storeInfo: false,
	arenaAccessToken: ''
}

interface EmbedInfo {
	title: string;
	arenaUrl: string;
	arenaClass: string,
	userUsername: string;
	userUrl: string;
	imageSquareUrl: string;
	imageThumbUrl: string;
	sourceUrl: string;
	contentHTML: string;
	embedFound: boolean;
	networkError: boolean;
	message: string;
}

export default class ArenaPlugin extends Plugin {
	settings: ArenaPluginSettings;

	getAllLeaves() {
		const ret = [] as WorkspaceLeaf[];
		this.app.workspace.iterateAllLeaves(leaf => { ret.push(leaf) })
		return ret;
	}
	
	createDummyBlock(el: HTMLElement) {
		const container = el.createDiv();
		container.addClass('dummy-container');
	}

	removeDummyBlock(el: HTMLElement) {
		const dummy = el.querySelector('.dummy-container');
		if(dummy){
			el.removeChild(dummy);
		}
	}

	async getEmbedInfo(url: string): Promise<EmbedInfo> {
		const info: EmbedInfo = {
			title: '',
			arenaUrl: '',
			arenaClass: '',
			userUsername: '',
			userUrl: '',
			imageSquareUrl: '',
			imageThumbUrl: '',
			sourceUrl: '',
			contentHTML: '',
			embedFound: false,
			networkError: false,
			message: '',
		};
		
		const pattern = /(?:https?:\/\/)?(?:www\.)?are\.na\/(block)\/(\d+)\/?/i;
		const match = url.match(pattern);

		let className, arenaID;
		if (match) {
			className = match[1];
			arenaID = match[2];
		} else {
			console.log("URL doesn't match the pattern.");
			info.message = `URL doesn't match the pattern.`;
			return info;
		}
		
		let reqUrl;
		switch (className) {
			case "block":
				info.arenaUrl = match[0];
				reqUrl = `https://api.are.na/v2/blocks/${arenaID}`;
				break;
			default:
				console.log("URL doesn't match the pattern.");
				info.message = `URL doesn't match the pattern.`;
				return info;
				break;
		}

		try {
			const headers = {
				'Authorization': `Bearer ${this.settings.arenaAccessToken}`,
			};
			const reqParam: RequestUrlParam = {
				url: reqUrl,
				method: 'GET',
				headers
			};
			const res = await requestUrl(reqParam);
			if (res.status === 200){
				// console.log( res.json );

				info.title =  res.json.title,
				// info.arenaUrl =  '',
				info.arenaClass =  res.json.class.toLowerCase(),
				info.userUsername =  res.json.user.username;
				info.userUrl = `https://www.are.na/${res.json.user.slug}`;
				info.imageSquareUrl = (res.json.image) ? res.json.image.square.url : '';
				info.imageThumbUrl = (res.json.image) ? res.json.image.thumb.url : '';
				info.sourceUrl = (res.json.source) ? res.json.source.url : '';
				info.contentHTML = res.json.content_html;
				info.embedFound =  true;
				info.networkError =  false;
				info.message =  'Success!';
			} else {
				console.log( res );
				const text = JSON.parse(res.text);
				info.message = `${text.message} (${text.code}), ${text.description}`;
			}
			
		} catch (error) {
			console.error(error);
			// Network error
			info.networkError = true;
			info.message = `Network error.`;
		}
		
		return info;
	}

	createEmbed(el: HTMLElement, info: EmbedInfo) {
		const container = el.createEl('a', {href: info.arenaUrl} );
		container.addClass('arena--block');

		const boxElement = container.createDiv();
		boxElement.addClass('arena--block--inner')
		boxElement.setAttribute('data-class', info.arenaClass );

		switch (info.arenaClass) {
			case "image":
			case "link":
				const imgElement = boxElement.createEl('img', { attr: { 'src': info.imageSquareUrl } });
				break;
			case "text":
				const textContainer = boxElement.createDiv()
				textContainer.innerHTML = info.contentHTML;
				break
			case "attachment":
			case "channel":
				break;
			default:
				break;
		}

		container.addClass('arena--block');
		const textElement = container.createDiv({text: info.title, title: info.title})
			.addClass('arena--block--caption');

		const buttonElement = boxElement.createEl('a', {href: info.sourceUrl, text:"Source" } )
			.addClass('arena--block--button');

	}

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor('arena', async (source, el, ctx) => {
			// console.log( source, el, ctx );
			this.createDummyBlock(el);
			el.setAttribute('data-status','busy');

			let sourceLines = source.trim().split('\n'); // array of urls from lines
			sourceLines = sourceLines.filter(Boolean); // drop empty lines

			sourceLines.forEach( async (url) =>{
				let info: EmbedInfo;

				info = await this.getEmbedInfo(url.toLowerCase());
				// console.log(info)

				// success
				if (info.embedFound){
					this.removeDummyBlock(el);
					this.createEmbed(el, info);
					el.setAttribute('data-status','ready');

				// something wrong
				} else {
					this.removeDummyBlock(el);
					el.setAttribute('data-status','error');
					const aElement = el.createEl('a', { text: url, href: url });
					const spanElement = el.createEl('span', { text: info.message });
					spanElement.addClass('arena--error--message');

				}
			})
		});

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			// console.log('✨ Click detected', evt);
			// console.log('✨ Click detected');
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

}

class SampleSettingTab extends PluginSettingTab {
	plugin: ArenaPlugin;

	async clearSettings() {
		// Clear all saved variables, including the access token
		this.plugin.settings.arenaAccessToken = ''; // Clear the access token
		this.plugin.settings = DEFAULT_SETTINGS;

		await this.plugin.saveSettings();
	}

	constructor(app: App, plugin: ArenaPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', { text: 'Are.na Plugin' });

		const arenaAccessTokenField = new Setting(containerEl)
			.setName('Access token (optional)')
			.setDesc('Used to access private blocks. Generate token at https://dev.are.na/oauth/applications. Use at your own risk.')
			.addText(text => text
				.setPlaceholder('Enter your access token')
				.setValue(this.plugin.settings.arenaAccessToken)
				.onChange(async (value) => {
					this.plugin.settings.arenaAccessToken = value;
					await this.plugin.saveSettings();
			}));

			new Setting(containerEl)
				.setName('Clear all settings')
				.setDesc('Wipes everything from cache including access tokens.')
				.addButton((btn) =>
					btn
						.setButtonText('Clear Saved Variables')
						// .setIcon('mod-danger')
						//@ts-ignore
						// .setTooltip('Use at your own risk!', {placement: 'top'})
						// .setDisabled(true)
						.onClick(async () => {
							// Clear your settings, including access tokens
							this.plugin.settings.arenaAccessToken = '';
							this.plugin.settings = DEFAULT_SETTINGS;
							await this.plugin.saveSettings();
							this.display();
							new Notice('Settings have been cleared.');
						}));
	}
}
