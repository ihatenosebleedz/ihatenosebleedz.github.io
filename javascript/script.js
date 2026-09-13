const discordId = "1243968906310324289";

let socket;
let heartbeatInterval;
let reconnectTimeout;

function updateDiscordStatus(user) {
    const activities = Array.isArray(user.activities)
        ? user.activities
        : [];

    const statusElement =
        document.getElementById("discord-status");

    if (statusElement) {
        statusElement.textContent =
            user.discord_status || "offline";
    }

    const customStatus =
        activities.find(activity => activity.type === 4);

    const customStatusElement =
        document.getElementById("discord-custom-status");

    if (customStatusElement) {
        customStatusElement.textContent =
            customStatus?.state || "nothing";
    }

    const activityElement =
        document.getElementById("discord-activity");

    if (!activityElement) {
        return;
    }

    const activity =
        activities.find(activity => activity.type !== 4);

    if (!activity) {
        activityElement.innerHTML = `
            <div class="activity-title">ACTIVITY</div>
            <div class="activity-body">nothing right now</div>
        `;
        return;
    }

    const typeNames = {
        0: "PLAYING",
        1: "STREAMING",
        2: "LISTENING TO",
        3: "WATCHING",
        5: "COMPETING IN"
    };

    const typeName =
        typeNames[activity.type] || "ACTIVITY";

    const name =
        activity.name || "Unknown Activity";

    const details =
        activity.details || "";

    const state =
        activity.state || "";

    let imageUrl = "";

    /*
     * Spotify exposes its album artwork separately.
     */
    if (user.listening_to_spotify && user.spotify) {
        imageUrl = user.spotify.album_art_url || "";
    }

    /*
     * Other Discord activities expose their image through
     * assets.large_image.
     */
    if (!imageUrl && activity.assets?.large_image) {
        const image = activity.assets.large_image;

        if (image.startsWith("mp:")) {
            imageUrl =
                "https://media.discordapp.net/" +
                image.substring(3);
        } else if (image.startsWith("https://")) {
            imageUrl = image;
        } else if (activity.application_id) {
            imageUrl =
                `https://cdn.discordapp.com/app-assets/${activity.application_id}/${image}.png`;
        }
    }

    activityElement.innerHTML = `
        <div class="activity-title">${typeName}</div>

        <div class="activity-content">
            ${
                imageUrl
                    ? `<img
                        class="activity-image"
                        src="${imageUrl}"
                        alt=""
                        loading="lazy"
                    >`
                    : ""
            }

            <div class="activity-info">
                <strong>${name}</strong>

                ${
                    details
                        ? `<div>${details}</div>`
                        : ""
                }

                ${
                    state
                        ? `<div class="activity-state">${state}</div>`
                        : ""
                }
            </div>
        </div>
    `;
}
function connectLanyard() {
    console.log("connecting to Lanyard...");

    socket = new WebSocket(
        "wss://api.lanyard.rest/socket"
    );

    socket.addEventListener("message", event => {
        let message;

        try {
            message = JSON.parse(event.data);
        } catch {
            return;
        }

        if (message.op === 1) {
            clearInterval(heartbeatInterval);

            heartbeatInterval = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(
                        JSON.stringify({
                            op: 3
                        })
                    );
                }
            }, message.d.heartbeat_interval);

            socket.send(
                JSON.stringify({
                    op: 2,
                    d: {
                        subscribe_to_id: discordId
                    }
                })
            );
        }

        if (
            message.op === 0 &&
            (
                message.t === "INIT_STATE" ||
                message.t === "PRESENCE_UPDATE"
            ) &&
            message.d
        ) {
            updateDiscordStatus(message.d);
        }
    });

    socket.addEventListener("close", () => {
        clearInterval(heartbeatInterval);
        clearTimeout(reconnectTimeout);

        reconnectTimeout = setTimeout(
            connectLanyard,
            5000
        );
    });
}

function setupVisitorCounter() {
    const element =
        document.getElementById("visitor-count");

    if (!element) {
        return;
    }

    const key =
        "ihatenosebleedz-visitor-count";

    const count =
        Number(localStorage.getItem(key) || 0) + 1;

    localStorage.setItem(
        key,
        count
    );

    element.textContent =
        String(count).padStart(6, "0");
}

function setupRandomQuote() {
    const button =
        document.getElementById("random-quote");

    const output =
        document.getElementById("quote-output");

    if (!button || !output) {
        return;
    }

    const quotes = [
        "it works on my machine.",
        "i should probably document this.",
        "sudo make me a sandwich.",
        "why is it using 8gb of ram?",
        "it was the config file.",
        "one more linux project.",
        "i have absolutely no idea why this works.",
        "have you tried turning it off and on again?"
    ];

    button.addEventListener("click", () => {
        output.textContent =
            quotes[
                Math.floor(
                    Math.random() * quotes.length
                )
            ];
    });
}

setupVisitorCounter();
setupRandomQuote();
connectLanyard();
