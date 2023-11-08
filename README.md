#  Are.na Plugin for Obsidian
Notetaking should be visual. This plugin enables Are.na content to be embedded in Obsidian.

### To-do
- [x] ~~Connection through API~~
- [x] ~~Load multiple blocks~~
- [x] ~~Display the following classes:~~
  - [x] ~~Image~~
  - [x] ~~Link~~
  - [x] ~~Text~~
  - [x] ~~Embed~~
  - [x] ~~Attachment~~
- [x] ~~Load private blocks (requires authentication)~~
- [x] ~~Load channel~~
  - [x] ~~Added display options~~
- [x] ~~Add commands~~
	- [x] ~~Block~~
	- [x] ~~Channel~~
	- [x] ~~Random blocks~~
- [ ] User testing

### How to use
- Download release
- 

### How to build
- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

### Manually installing the plugin
Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/arena-plugin/`.

### Accessing private blocks (authentication)
To access private blocks, you will need an access token. Generate token at https://dev.are.na/oauth/applications and store it in Are.na Plugin's settings.
