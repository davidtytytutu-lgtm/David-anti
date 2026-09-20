const http = require("http");
const {
    Client,
    GatewayIntentBits
} = require("discord.js");

// ==================================================
// CONFIGURATION
// ==================================================

const PORT = process.env.PORT || 10000;

const HEARTBEAT_SERVER_URL =
    process.env.HEARTBEAT_SERVER_URL;

const HEARTBEAT_SECRET =
    process.env.HEARTBEAT_SECRET;

const HEARTBEAT_DELAY = 5000;

// ==================================================
// DISCORD
// ==================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ==================================================
// SERVEUR HTTP
// ==================================================

const server = http.createServer((req, res) => {

    // ==============================================
    // HEARTBEAT
    // ==============================================

    if (req.url === "/heartbeat") {

        console.log(
            "💓 Heartbeat reçu du HEARTBEAT SERVER"
        );

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            status: "ok",
            heartbeat: true,
            bot: "DAVID-DISCORD-MOD",
            discord: client.isReady()
        }));

        return;
    }

    // ==============================================
    // STATUS
    // ==============================================

    if (req.url === "/") {

        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end(
            "🛡️ DAVID DISCORD MOD est en ligne !"
        );

        return;
    }

    // ==============================================
    // 404
    // ==============================================

    res.writeHead(404);

    res.end("404 - Not Found");
});

// ==================================================
// HEARTBEAT → HEARTBEAT SERVER
// ==================================================

async function sendHeartbeat() {

    if (!HEARTBEAT_SERVER_URL) {

        console.log(
            "⚠️ HEARTBEAT_SERVER_URL n'est pas configuré."
        );

        return;
    }

    try {

        console.log(
            "💓 DAVID MOD → HEARTBEAT SERVER"
        );

        const response = await fetch(
            HEARTBEAT_SERVER_URL,
            {
                headers: {
                    "Authorization":
                        `Bearer ${HEARTBEAT_SECRET || ""}`
                }
            }
        );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data = await response.json();

        console.log(
            "✅ Heartbeat accepté :",
            data.status
        );

    } catch (error) {

        console.error(
            "❌ Heartbeat erreur :",
            error.message
        );
    }

    setTimeout(
        sendHeartbeat,
        HEARTBEAT_DELAY
    );
}

// ==================================================
// DISCORD READY
// ==================================================

client.once("ready", () => {

    console.log(
        `🤖 Connecté à Discord : ${client.user.tag}`
    );

    console.log(
        `🛡️ DAVID DISCORD MOD prêt`
    );
});

// ==================================================
// MESSAGES
// ==================================================

client.on("messageCreate", async (message) => {

    if (message.author.bot) return;

    // ==============================================
    // FUTUR :
    // ANTI-INSULTE
    // ANTI-NSFW
    // AVERTISSEMENTS
    // LOGS
    // ==============================================

});

// ==================================================
// DÉMARRAGE HTTP
// ==================================================

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🌐 Serveur HTTP démarré sur le port ${PORT}`
        );

        console.log(
            `🛡️ Port : ${PORT}`
        );

        setTimeout(
            sendHeartbeat,
            1000
        );
    }
);

// ==================================================
// DISCORD LOGIN
// ==================================================

if (!process.env.DISCORD_TOKEN) {

    console.error(
        "❌ DISCORD_TOKEN est manquant !"
    );

    process.exit(1);
}

client.login(
    process.env.DISCORD_TOKEN
);
