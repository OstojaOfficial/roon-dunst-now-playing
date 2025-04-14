# Roon Now Playing Extension

This repository contains a Now Playing extension for [Roon](https://roonlabs.com/) that displays current track metadata, including cover art and lyrics. It integrates with the official [roon-kit](https://github.com/Stevenic/roon-kit) API and uses a Python script to fetch lyrics from the Musixmatch API.

## Contents

- `roon_extension.js`: Main Roon extension that listens to playback events and displays Now Playing information.
- `get_lyrics.py`: Python script that fetches lyrics from Musixmatch based on artist and song title.

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

### Python (for `get_lyrics.py`)
- Python 3.x
- `requests` library


## Setup

### API Key
This extension requires a [Musixmatch](https://developer.musixmatch.com/) API key to fetch lyrics. Save your API key to:

```bash
~/.apikeys/musixmatch
```

Make sure the file contains only your API key as plain text.

### Run the extension
Start the Roon extension using Node.js:
```bash
node roon_extension.js
```

Make sure Python is in your PATH and executable from the same environment.

## Features

- Displays Now Playing info using the Roon API.
- Automatically fetches lyrics from Musixmatch.
- Uses cover art from Roon and external metadata if available.

### Waybar config
In modules add 
```
"custom/roon",
```
then add the extension block
```
  "custom/roon": {
    "exec": "cat /tmp/waybar_roon_info.json",
    "format": "{text}",
    "tooltip": true,
    "return-type": "json",
    "signal": 3
  },
```

## License

MIT License


