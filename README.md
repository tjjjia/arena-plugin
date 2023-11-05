#  Are.na Plugin for Obsidian
Notetaking should be visual. This plugin enables Are.na blocks to be embedded in Obsidian.

### To-do
- [x] Connection through API
- [x] Load multiple blocks
- [x] Display the following classes:
  - [x] Image
  - [x] Link
  - [x] Text
  - [ ] Embed
  - [ ] Attachment
- [x] Load private blocks (requires authentication)
- [ ] User testing

### How to use
- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

### Manually installing the plugin
Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/arena-plugin/`.

### Accessing private blocks (authentication)
To access private blocks, you will need an access token. Generate token at [https://dev.are.na/oauth/applications] and store it in the plugin's setting.
