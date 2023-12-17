#  Are.na Plugin for Obsidian
Notetaking should be visual. This plugin enables Are.na content to be embedded in Obsidian.

## How to use

Download release, install, and use a code block to include Are.na blocks or channels. Alternatively, access plugins through the command palette (`⌘` `P` or `Control` `P`).

### Display a single block
````
```arena
https://www.are.na/block/1907724
```
````

### Display multiple blocks
````
```arena
https://www.are.na/block/1907723
https://www.are.na/block/1907724
https://www.are.na/block/1919575
```
````

### Display a channel
````
```arena
https://www.are.na/michael-tjia/fresh-tulips-of-bel-air
```
````

### Accessing private blocks (authentication)
To access private blocks, you will need an access token. Generate token at https://dev.are.na/oauth/applications and store it in Are.na Plugin's settings.


## To-do
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

## How to build
- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin
Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/arena-plugin/`.
