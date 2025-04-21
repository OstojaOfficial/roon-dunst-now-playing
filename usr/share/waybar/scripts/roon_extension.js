const { RoonExtension } = require('roon-kit');
const fs = require('fs');
const { exec } = require('child_process');

const lyricsScriptPath = "/usr/share/waybar/scripts/get_lyrics.py";
let pairedCore = null;
global.lastSeek = null;
global.lastZone = null;
global.lastLyrics = 'No lyrics avilale.';

function getLyrics(artist, title, callback) {
    const cmd = `python3 ${lyricsScriptPath} "${artist}" "${title}"`;
    log(`Executing: ${cmd}`);
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            log(` Error in getLyrics: ${stderr}`);
            callback("No lyrics available.");
        } else {
            const lyrics = stdout.trim();
            log(` Lyrics available (${lyrics.length} chars)`);
            callback(lyrics || "No lyrics available.");
        }
    });
}

function truncateText(str, maxLength = 80) {
    const chars = [...str];
    return chars.length > maxLength ? chars.slice(0, maxLength).join('') + '…' : str;
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function progressBar(current, total, length = 20) {
    if (!total || total === 0) return '';
    const percent = current / total;
    const filled = Math.round(percent * length);
    return '▰'.repeat(filled) + '▱'.repeat(length - filled);
}

function escapeMarkup(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function log(msg) {
    const timestamp = new Date().toISOString();
    const fullMsg = `[${timestamp}] ${msg}`;
    console.log(fullMsg);
    fs.appendFileSync('/tmp/roon_debug.log', fullMsg + '\n');
}

const extension = new RoonExtension({
    description: {
        extension_id: 'roon-kit-now-playing',
        display_name: "Roon Kit Now Playing",
        display_version: "0.4.2",
        publisher: 'roon-kit',
        email: 'stevenic@microsoft.com',
        website: 'https://github.com/Stevenic/roon-kit'
    },
    RoonApiBrowse: 'not_required',
    RoonApiImage: 'required',
    RoonApiTransport: 'required',
    subscribe_outputs: false,
    subscribe_zones: true,
    log_level: 'none'
});

extension.on("subscribe_zones", async (core, response, body) => {
    log("subscribe_zones event received");
    log(JSON.stringify(body, null, 2));

    const changedZones = body.zones_changed ?? [];
    const addedZones = body.zones_added ?? [];
    const removedZones = body.zones_removed ?? [];

    if (removedZones.length > 0) {
        fs.writeFileSync('/tmp/waybar_roon_info.json', JSON.stringify({ text: '', tooltip: '' }));
        exec("pkill -RTMIN+3 waybar");
        return;
    }

for (const zone of [...addedZones, ...changedZones]) {
    if (zone.state !== 'playing') {
        log(` Zona "${zone.display_name}" is not playing (state: ${zone.state}), cleaning Waybar`);
        fs.writeFileSync('/tmp/waybar_roon_info.json', JSON.stringify({ text: '', tooltip: '' }));
        exec("pkill -RTMIN+3 waybar");
        continue;
    }


        global.lastZone = zone;

        const rawTrack = zone.now_playing?.three_line?.line1 || '';
        const rawArtist = zone.now_playing?.three_line?.line2 || '';
        const album = zone.now_playing?.three_line?.line3 || '';
        const mediaType = zone.now_playing?.media_type || '';
        const sampleRate = zone.now_playing?.sample_rate || 0;
        const bitDepth = zone.now_playing?.bits_per_sample || 0;
        const channels = zone.now_playing?.channels || 0;
        const year = zone.now_playing?.release_year || '';
        const genre = zone.now_playing?.genre || '';
        const duration = zone.now_playing?.length || 0;
        const position = zone.now_playing?.seek_position || 0;
        const remaining = Math.max(duration - position, 0);

        const bitrate = sampleRate && bitDepth && channels
            ? `${Math.round(sampleRate * bitDepth * channels / 1000)} kbps`
            : '';

        const displayText = truncateText(
            `${rawTrack} - ${rawArtist} • ${album} • ${formatTime(remaining)} restantes`,
            80
        );

        const bar = progressBar(position, duration);

        const currentTrackInfo = `${rawArtist} - ${rawTrack}`;
        fs.writeFileSync("/tmp/roon_track.txt", currentTrackInfo);

        getLyrics(rawArtist, rawTrack, async (lyrics) => {
            global.lastLyrics = lyrics || 'No lyrics available.';

            const headerLine = `${rawArtist} - ${rawTrack}`;
            const tooltip =
`${headerLine}
Álbum: ${album}
${year || genre ? `Year: ${year}    Genre: ${genre}` : ''}
Duration: ${formatTime(position)} / ${formatTime(duration)}
${bar}

${lyrics}`;

            const data = {
                text: escapeMarkup(displayText),
                tooltip: escapeMarkup(tooltip)
            };

            log("writing waybar_roon_info.json with: " + JSON.stringify(data));
            fs.writeFileSync('/tmp/waybar_roon_info.json', JSON.stringify(data));
            exec("pkill -RTMIN+3 waybar");

            const image_key = zone.now_playing?.image_key;
            if (image_key && pairedCore) {
                try {
                    const imageData = await pairedCore.services.RoonApiImage.get_image(image_key, { width: 300, height: 300 });
                    const coverPath = '/tmp/roon_album_cover.jpg';
                    fs.writeFileSync(coverPath, imageData.image);
                    exec(`notify-send -i ${coverPath} "Now Playing" "${headerLine}"`);
                } catch (error) {
                    console.error("Error getting cover:", error);
                    exec(`notify-send "Now Playing" "${headerLine}"`);
                }
            } else {
                exec(`notify-send "Now Playing" "${headerLine}"`);
            }
        });
    }

    const seekUpdates = body.zones_seek_changed ?? [];

    for (const update of seekUpdates) {
        const zone = global.lastZone;
        if (!zone || zone.zone_id !== update.zone_id || zone.state !== "playing") continue;

        const rawTrack = zone.now_playing?.three_line?.line1 || '';
        const rawArtist = zone.now_playing?.three_line?.line2 || '';
        const album = zone.now_playing?.three_line?.line3 || '';
        const duration = zone.now_playing?.length || 0;
        const position = update.seek_position || 0;
        const remaining = Math.max(duration - position, 0);

        const bar = progressBar(position, duration);
        const displayText = truncateText(
            `${rawTrack} - ${rawArtist} • ${album} • ${formatTime(remaining)} restantes`,
            80
        );

        const tooltip =
`${rawArtist} - ${rawTrack}
Álbum: ${album}
Duration: ${formatTime(position)} / ${formatTime(duration)}
${bar}

${global.lastLyrics}`;

        const data = {
            text: escapeMarkup(displayText),
            tooltip: escapeMarkup(tooltip)
        };

        if (global.lastSeek !== position) {
            fs.writeFileSync('/tmp/waybar_roon_info.json', JSON.stringify(data));
            exec("pkill -RTMIN+3 waybar");
            global.lastSeek = position;
        }
    }
});

extension.start_discovery();
extension.set_status('Waiting for connection to Roon Core ...');
log("searching Core...");

(async () => {
    const core = await extension.get_core();
    if (core) {
        pairedCore = core;
        log("Paired with Roon Core");
        extension.set_status('Paired with Roon Core');
    } else {
        log(" Not paired with any Core");
    }
})();

