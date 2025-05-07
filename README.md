# Roon Dunst Now Playing Extension

This is a modified fork of teraflops's [Roon Now Playing](https://gitlab.com/teraflops/roon_now_playing). This fork is a simplified and made to be used primarly for dunst.

## Contents

- `roon_extension.js`: Main Roon extension that listens to playback events and displays Now Playing information.

## Requirements

### Node.js (for `roon_extension.js`)
- [roon-kit](https://github.com/Stevenic/roon-kit)
- Node.js 18+

Install dependencies:
```bash
npm install roon-kit
```
on Arch Linux:
```
yay -S roon-kit
```

### Run the extension
Start the Roon extension using Node.js:
```bash
node roon_extension.js
```

## License

MIT License