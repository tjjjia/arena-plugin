#  ✶✶ Are.na Plugin for Obsidian
Notetaking should be visual. This plugin enables Are.na content to be embedded in Obsidian, creating new connections between notes, blocks, and channels.

## How to use

1. Download release
2. Unpack contents to your Vault (`VaultFolder/.obsidian/plugins/arena-plugin/`).
3. Ensure the plugin is activated. You can do this in Obsidian's preference pane.
4. Use a code block (see examples) to include Are.na blocks or channels. Alternatively, access plugin commands through the command palette (`⌘` `P` or `Control` `P`).
5. Optional: Customize Are.na Plugin's settings or [add a token](#accessing-private-blocks-authentication) to access private blocks. (Optional)

### Example: Display a single block
````
```arena
https://www.are.na/block/4389827
```
````

### Example: Display multiple blocks
````
```arena
https://www.are.na/block/1907723
https://www.are.na/block/5669256
https://www.are.na/block/9444327
```
````

### Example: Display a channel
````
```arena
https://www.are.na/michael-tjia/fresh-tulips-of-bel-air
```
````

### Accessing private blocks (Authentication)
To access private blocks, you will need an access token. Generate your token at https://dev.are.na/oauth/applications and store it in Are.na Plugin's settings.

## How to build

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.
