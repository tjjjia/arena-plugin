import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, requestUrl, RequestUrlParam, Setting, WorkspaceLeaf } from 'obsidian';
import { format, render, cancel, register } from 'timeago.js';

interface ArenaPluginSettings {
	arenaAccessToken: string;
	notificationHeader: string;
	enableChannelBlock: boolean;
	lengthMax: string;
	userSlug: string;
}
const DEFAULT_SETTINGS: ArenaPluginSettings = {
	arenaAccessToken: '',
	notificationHeader: 'Are.na Plugin:',
	enableChannelBlock: true,
	lengthMax: '20',
	userSlug: ''
}

interface LinkInfo {
	title: string;
	arenaUrl: string;
	arenaClass: string;
	blockStatus: string;
	length: number;
	dateUpdated: string;
	userUsername: string;
	userUrl: string;
	imageSquareUrl: string;
	imageThumbUrl: string;
	sourceUrl: string;
	contentHTML: string;
	attachmentExtension: string;
}

interface ApiRequest {
	url: string;
	class: string;
}

export default class ArenaPlugin extends Plugin {
	settings: ArenaPluginSettings;
	
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

	constructAPI(url: string): ApiRequest {
		const apiRequest: ApiRequest = {
			url: '',
			class: ''
		}
		// 1 first split url into portions
		// are.na/{match[1]}/match[2]/
		let pattern;
		pattern = /(?:https?:\/\/)?(?:www\.)?are\.na\/([^/]+)\/([^/]+)\/?|(random)\:(personal|anyone)/i;
		// pattern = /(?:https?:\/\/)?(?:www\.)?are\.na\/([^/]+)\/([^/]+)\/?/i;
		const matches = url.match(pattern); // returns array

		// if nothing matches, assume wrong url
		if (!matches) {
			console.error("URL doesn't match the pattern.");
			new Notice(`${this.settings.notificationHeader} URL doesn\'t match the pattern.`);
			apiRequest.class = 'unknown';

			return apiRequest;
		// if matches[1] present, check for blocks or channels
		} else if ( matches[1] !== undefined ){
			// 2 first check if we are dealing with
			// channel | block | name-surname | other, 
			// pass class through object
			let apiResource, arenaID;
			switch (matches[1]) {
				case 'block':
					apiResource = 'blocks';
					apiRequest.class = 'block';
					break;
				case 'channel':
				case 'channels':
				default: // also collect all other strings for 'name-surname'
					apiResource = 'channels';
					apiRequest.class = 'channel';
					break;
				}
			arenaID = matches[2]; // ID or slug
	
			// 2 formulate appropriate api calls based on case
			apiRequest.url = `https://api.are.na/v2/${apiResource}/${arenaID}`;
		} else if ( matches[3] === 'random' ) {
			apiRequest.url = `https://api.are.na/v2/users/${this.settings.userSlug}/search?sort=random&subject=Block&filter[type]=image`;
			apiRequest.class = 'random:personal';
		}
		
		return apiRequest;
	}

	async fetchAPI(reqUrl: string, reqClass: string) {
		try {
			const headers = {
				'Authorization': `Bearer ${this.settings.arenaAccessToken}`
			};

			const reqParam: RequestUrlParam = {
				url: reqUrl,
				method: 'GET',
				headers,
				throw: false // required for correct error handling
			};

			const res = await requestUrl(reqParam); // get the results

			if (res.status === 200){
				// all is good
				return res.json;
			} else {
				// error handling from here on
				const notice = res.json;
					console.error(`${this.settings.notificationHeader} Unexpected API response:`, res.status, res.json);
					new Notice(`${this.settings.notificationHeader} ${res.status} ${notice.message}\n${notice.description}`);
				return;
			}
		} catch (error) {
			// network error
			console.error(error);
			new Notice(`${this.settings.notificationHeader} Network error\nPlease check your internet connection and try again.`);
		}
	}

	createError(el: HTMLElement, message: string){
		const textEl = el.createDiv();
		textEl.addClass('arena--error');
		textEl.setText(message);
	}

	createEmbed(el: HTMLElement, info: LinkInfo) {
		const container = el.createEl('a', {href: info.arenaUrl} );
		container.addClass('arena--block');

		const boxElement = container.createDiv();
		boxElement.addClass('arena--block--inner')
		boxElement.setAttribute('data-class', info.arenaClass );
		boxElement.setAttribute('data-status', info.blockStatus ); // mostly useful for generated title/channel blocks

		container.addClass('arena--block');
		let captionElement;

		console.log(info.arenaClass)
		switch (info.arenaClass) {
			case "media":
			case "image":
			case "link":
				const imgElement = boxElement.createEl('img', { attr: { 'src': info.imageSquareUrl } });

				container.createDiv({text: info.title, title: info.title})
					.addClass('arena--block--caption');
	
				break;
			case "text":
				const textContainer = boxElement.createDiv()
				textContainer.innerHTML = info.contentHTML;

				container.createDiv({text: info.title, title: info.title})
					.addClass('arena--block--caption');
				break
			case "attachment":
				const filetypeContainer = boxElement.createDiv()
				filetypeContainer.innerText = `${info.attachmentExtension}`;

				container.createDiv({text: info.title, title: info.title})
					.addClass('arena--block--caption');
				break
			case "channel":
				const channelContainer = boxElement.createDiv()
				channelContainer.innerHTML = `<h3>${info.title}</h3><p>by ${info.userUsername}<br>${info.length} blocks • ${format(info.dateUpdated, 'en_US')}</p>`;

				break;
			default:
				break;
		}


		const buttonElement = boxElement.createEl('a', {href: info.sourceUrl, text:"Source" } )
			.addClass('arena--block--button');

	}

	getLinkInfo(data: any): LinkInfo {
		// input: data object from arena
		// output: a LinkInfo object consisting of parsed data, ready for element generator
		const info: LinkInfo = {
			title: data.title ? data.title : '', 				// title of channel | block
			arenaUrl: `https://www.are.na/${data.base_class.toLowerCase()}/${data.id}`, 	// url to block or channel, starting with //www.are.na/block/
			arenaClass: data.class.toLowerCase(), 		// link | channel | attachment | image | embed | etc.
			blockStatus: data.status, // public | closed | private
			length: data.length ? data.length : 0,
			dateUpdated: data.updated_at,
			userUsername: data.user.username, 	// are.na user
			userUrl: `https://www.are.na/${data.user.slug}`, 			// url to are.na profile page, starting with //www.are.na/
			imageSquareUrl: (data.image) ? data.image.square.url : '', 	// url to image (square)
			imageThumbUrl: (data.image) ? data.image.thumb.url : '', 	// url to image (original aspect ratio)
			sourceUrl: (data.source) ? data.source.url : '', 		// link to source (possibly non-are.na)
			contentHTML: (data.content_html) ? data.content_html : '', 		// to store text block content
			attachmentExtension: (data.attachment) ? data.attachment.extension : ''
		};
		
		return info;
	}

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor('arena', async (source, el, ctx) => {
			el.setAttribute('data-status','busy');

			let sourceLines = source.trim().split('\n'); // array of urls from lines
			sourceLines = sourceLines.filter(Boolean); // drop empty lines

			sourceLines.forEach( async (url, index) =>{
				// construct appropriate api request
				const apiRequest = this.constructAPI(url);

				 // in case there is no url generated
				if(!apiRequest.url){ 
					this.createError(el, `[Are.na Plugin] Failed to load ${url} on line ${index+1}.`);
					el.setAttribute('data-status','error');
					return;
				};
				
				// fetch data through appropriate api
				const data = await this.fetchAPI(apiRequest.url, apiRequest.class);
				if(!data){ 
					this.createError(el, `[Are.na Plugin] Failed to load ${url}`);
					return;
				};
				console.log(data);

				// prepare data as array of blocks
				let blocks: any[] = [];
				switch (apiRequest.class) {
					// we have a channel, expect many
					case "channel":
						if(this.settings.enableChannelBlock === true){
							// make a title block for channels, structure the same way as are.na
							const channelBlock = {
								title: data.title,
								base_class: data.base_class,
								id: data.id,
								updated_at: data.updated_at,
								class: 'channel',
								length: data.length,
								user: data.user,
								image: data.image,
								source: data.source,
								status: data.status
							}
							blocks.push( channelBlock );
						}
						blocks = blocks.concat(data.contents);
						break;
					// we have a block, expect one
					case "random:anyone":
					case "random:personal":
						console.log( data )
						blocks = blocks.concat(data.blocks);
						break;
					case "block":
						blocks.push( data );
						break;
					default:
						// error has been handled already;
						return;
						break;
				}

				// display blocks
				const lengthMax = this.settings.lengthMax ? parseInt(this.settings.lengthMax) : 20;
				blocks.forEach( (block: any, index: number) => {
					if( index > lengthMax - 1 ){ return; }

					const info = this.getLinkInfo(block); // get data
					this.createEmbed(el, info);
				})

			})
			el.setAttribute('data-status','ready');
		});

		// Add a custom command to insert a code block
		this.addCommand({
			id: 'insert-block',
			name: 'Insert block',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				// Define the content of your code block
				const codeContent = '```arena\nhttps://www.are.na/block/123456\n```';

				// Insert the code block at the current cursor position
				editor.replaceSelection(codeContent);
			},
		});
		this.addCommand({
			id: 'insert-channel',
			name: 'Insert channel',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				// Define the content of your code block
				const codeContent = '```arena\nhttps://www.are.na/channels/diagrams-of-thought\n```';

				// Insert the code block at the current cursor position
				editor.replaceSelection(codeContent);
			},
		});
		this.addCommand({
			id: 'insert-random-personal',
			name: 'Insert random blocks (of yours)',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				// Define the content of your code block
				const codeContent = '```arena\nrandom:personal\n```';

				// Insert the code block at the current cursor position
				editor.replaceSelection(codeContent);
			},
		});
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
		
		containerEl.createEl('h2', { text: 'Display Options' });

		new Setting(containerEl)
			.setName('Enable title block')
			.setDesc('Show leading title block for channels.')
			.addToggle((toggle) => { toggle
				.setValue(this.plugin.settings.enableChannelBlock)
				.onChange((value) => {
					this.plugin.settings.enableChannelBlock = value;
					this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Amount of blocks to show')
			.setDesc('Enter a range from 1 to 20.')
			.addText(text => text
				.setPlaceholder('0-20')
				.setValue(this.plugin.settings.lengthMax.toString())
				.onChange(async (value) => {
					this.plugin.settings.lengthMax = value;
					await this.plugin.saveSettings();
			}));

		containerEl.createEl('h2', { text: 'Data and Authentication' });

		new Setting(containerEl)
			.setName('Username (optional)')
			.setDesc('Fetch personalized, random blocks.')
			.addText(text => text
				.setPlaceholder('charles-broskoski')
				.setValue(this.plugin.settings.userSlug)
				.onChange(async (value) => {
					this.plugin.settings.userSlug = value;
					await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
			.setName('Access token (optional)')
			.setDesc('Required to access private blocks. Generate token at https://dev.are.na/oauth/applications. Use at your own risk.')
			.addText(text => text
				.setPlaceholder('Enter your access token.')
				.setValue(this.plugin.settings.arenaAccessToken)
				.onChange(async (value) => {
					this.plugin.settings.arenaAccessToken = value;
					await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
			.setName('Clear plugin settings')
			.setDesc('Wipe everything from cache including access tokens.')
			.addButton((btn) => btn
				.setButtonText('Clear')
				.setClass('mod-warning')
				.onClick(async () => {
					// Clear your settings, including access tokens
					this.plugin.settings.arenaAccessToken = '';
					this.plugin.settings = DEFAULT_SETTINGS;
					await this.plugin.saveSettings();
					this.display();
					new Notice('Are.na Plugin: Settings have been cleared.');
			}));
	}
}
