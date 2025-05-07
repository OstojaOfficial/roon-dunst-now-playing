const { RoonExtension } = require('roon-kit');
const fs = require('fs');
const { exec } = require('child_process');

let pairedCore = null;
let lastTrack = null;

function log(msg) {
    const timestamp = new Date().toISOString();
    const fullMsg = `[${timestamp}] ${msg}`;
    console.log(fullMsg);
    fs.appendFileSync('/tmp/roon_debug.log', fullMsg + '\n');
}

const extension = new RoonExtension({
    description: {
        extension_id: 'roon-dunst-now-playing',
        display_name: "Roon Dunst Now Playing",
        display_version: "1.0.0",
        publisher: 'Ostoja',
        email: 'OstojaSredojevic@protonmail.com',
        website: 'https://github.com/OstojaOfficial/roon-dunst-now-playing'
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

    for (const zone of [...addedZones, ...changedZones]) {
        if (zone.state !== 'playing') {
            log(`Zone "${zone.display_name}" is not playing (state: ${zone.state})`);
            continue;
        }

        const rawTrack = zone.now_playing?.three_line?.line1 || '';
        const rawArtist = zone.now_playing?.three_line?.line2 || '';

        const headerLine = `${rawArtist} - ${rawTrack}`;

        const image_key = zone.now_playing?.image_key;
        if (image_key && pairedCore && lastTrack != rawTrack) {
            try {
                const imageData = await pairedCore.services.RoonApiImage.get_image(image_key, { width: 300, height: 300 });
                const coverPath = '/tmp/roon_album_cover.jpg';
                fs.writeFileSync(coverPath, imageData.image);
                exec(`notify-send -t 1250 -i ${coverPath} "Now Playing" "${headerLine}"`);
            } catch (error) {
                console.error("Error getting cover:", error);
                exec(`notify-send -t 1250 "Now Playing" "${headerLine}"`);
            }
            lastTrack = rawTrack;
        }
    }
});

extension.start_discovery();
extension.set_status('Waiting for connection to Roon Core ...');
log("Searching Core...");

(async () => {
    const core = await extension.get_core();
    if (core) {
        pairedCore = core;
        log("Paired with Roon Core");
        extension.set_status('Paired with Roon Core');
    } else {
        log("Not paired with any Core");
    }
})();