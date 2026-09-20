const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const http = require("http");

// ============================================================
// CONFIGURATION
// ============================================================

const TOKEN = process.env.DISCORD_TOKEN;

const GUILD_ID = "1550531386295718060";

// ------------------------------------------------------------
// HEARTBEAT
// ------------------------------------------------------------

const HEARTBEAT_SERVER_URL =
    process.env.HEARTBEAT_SERVER_URL;

const HEARTBEAT_SECRET =
    process.env.HEARTBEAT_SECRET;

const HEARTBEAT_DELAY = 10000;
const HEARTBEAT_RETRY_DELAY = 30000;

// ------------------------------------------------------------
// RGB
// ------------------------------------------------------------

const RGB_DELAY = 7000;

// ------------------------------------------------------------
// BOT
// ------------------------------------------------------------

const BOT_START_TIME = Date.now();

// ============================================================
// RGB NAME
// ============================================================

const RGB_NAMES = [
    "🔴𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🔴",
    "🟠𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🟠",
    "🟡𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🟡",
    "🟢𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🟢",
    "🔵𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🔵",
    "⚫𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢⚫",
    "🟤𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🟤",
    "🟣𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🟣"
];

let rgbIndex = 0;
let rgbStarted = false;

// ============================================================
// CLIENT DISCORD
// ============================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ============================================================
// HELPERS
// ============================================================

function formatUptime(ms) {

    let seconds = Math.floor(ms / 1000);

    const days = Math.floor(seconds / 86400);

    seconds %= 86400;

    const hours = Math.floor(seconds / 3600);

    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);

    seconds %= 60;

    const parts = [];

    if (days) {
        parts.push(`${days}j`);
    }

    if (hours) {
        parts.push(`${hours}h`);
    }

    if (minutes) {
        parts.push(`${minutes}m`);
    }

    parts.push(`${seconds}s`);

    return parts.join(" ");
}

function formatBytes(bytes) {

    if (!bytes) {
        return "0 B";
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];

    let i = 0;

    let value = bytes;

    while (
        value >= 1024 &&
        i < units.length - 1
    ) {

        value /= 1024;

        i++;
    }

    return `${value.toFixed(2)} ${units[i]}`;
}

function avatar(user) {

    return user.displayAvatarURL({
        extension: "png",
        size: 256
    });
}

function sleep(ms) {

    return new Promise(
        resolve => setTimeout(resolve, ms)
    );
}

// ============================================================
// HTTP SERVER
// ============================================================

const server = http.createServer(
    (req, res) => {

        // ====================================================
        // HEARTBEAT REÇU
        // ====================================================

        if (req.url === "/heartbeat") {

            const authorization =
                req.headers.authorization;

            if (
                HEARTBEAT_SECRET &&
                authorization !==
                `Bearer ${HEARTBEAT_SECRET}`
            ) {

                console.log(
                    "🚫 Heartbeat refusé : secret incorrect"
                );

                res.writeHead(401, {
                    "Content-Type":
                        "application/json; charset=utf-8"
                });

                res.end(
                    JSON.stringify({
                        status: "unauthorized",
                        heartbeat: false,
                        bot: "DAVID-ANTI"
                    })
                );

                return;
            }

            console.log(
                "💓 Heartbeat reçu du HEARTBEAT SERVER"
            );

            res.writeHead(200, {
                "Content-Type":
                    "application/json; charset=utf-8"
            });

            res.end(
                JSON.stringify({
                    status: "ok",
                    heartbeat: true,
                    bot: "DAVID-ANTI",
                    discord: client.isReady(),
                    timestamp: Date.now()
                })
            );

            return;
        }

        // ====================================================
        // PAGE PRINCIPALE
        // ====================================================

        if (req.url === "/") {

            res.writeHead(200, {
                "Content-Type":
                    "text/html; charset=utf-8"
            });

            res.end(`
<!DOCTYPE html>

<html lang="fr">

<head>

<meta charset="UTF-8">

<title>DAVID ANTI</title>

<style>

body {
    background: #050505;
    color: #00ff66;
    font-family: monospace;
    text-align: center;
    padding-top: 80px;
}

.box {
    border: 1px solid #00ff66;
    padding: 30px;
    max-width: 600px;
    margin: auto;
}

h1 {
    font-size: 42px;
}

</style>

</head>

<body>

<div class="box">

<h1>🛡️ DAVID ANTI</h1>

<p>🟢 ONLINE</p>

<p>Discord moderation bot actif.</p>

<p>
Uptime :
${formatUptime(
    Date.now() - BOT_START_TIME
)}
</p>

</div>

</body>

</html>
`);

            return;
        }

        // ====================================================
        // 404
        // ====================================================

        res.writeHead(404, {
            "Content-Type":
                "application/json; charset=utf-8"
        });

        res.end(
            JSON.stringify({
                error: "Not Found"
            })
        );
    }
);

// ============================================================
// START HTTP SERVER
// ============================================================

server.listen(
    process.env.PORT || 10000,
    "0.0.0.0",
    () => {

        console.log(
            `🌐 Serveur HTTP démarré sur le port ${
                process.env.PORT || 10000
            }`
        );

    }
);

// ============================================================
// HEARTBEAT → DAVID-BEAT
// ============================================================

async function sendHeartbeatToServer() {

    if (!HEARTBEAT_SERVER_URL) {

        console.error(
            "❌ HEARTBEAT_SERVER_URL n'est pas configuré."
        );

        setTimeout(
            sendHeartbeatToServer,
            HEARTBEAT_RETRY_DELAY
        );

        return;
    }

    console.log(
        "💓 DAVID ANTI → HEARTBEAT SERVER"
    );

    try {

        const response = await fetch(
            HEARTBEAT_SERVER_URL,
            {
                method: "GET",

                headers: {
                    "Accept":
                        "application/json",

                    "Authorization":
                        `Bearer ${HEARTBEAT_SECRET || ""}`,

                    "User-Agent":
                        "DAVID-ANTI"
                },

                signal:
                    AbortSignal.timeout(10000)
            }
        );

        console.log(
            `💓 Réponse heartbeat : HTTP ${response.status}`
        );

        // ----------------------------------------------------
        // On lit d'abord le texte.
        // Cela évite "Unexpected token" si le serveur
        // renvoie accidentellement autre chose que du JSON.
        // ----------------------------------------------------

        const responseText =
            await response.text();

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status} : ${
                    responseText.slice(0, 200)
                }`
            );
        }

        let data;

        try {

            data = JSON.parse(
                responseText
            );

        } catch {

            throw new Error(
                `Réponse non-JSON reçue : ${
                    responseText.slice(0, 200)
                }`
            );
        }

        if (
            data.status !== "ok"
        ) {

            throw new Error(
                "Heartbeat refusé par le serveur."
            );
        }

        console.log(
            "✅ Heartbeat réussi :",
            data
        );

        setTimeout(
            sendHeartbeatToServer,
            HEARTBEAT_DELAY
        );

    } catch (error) {

        console.error(
            "❌ Heartbeat échoué :",
            error.message
        );

        console.log(
            `🔄 Nouvelle tentative dans ${
                HEARTBEAT_RETRY_DELAY / 1000
            } secondes...`
        );

        setTimeout(
            sendHeartbeatToServer,
            HEARTBEAT_RETRY_DELAY
        );
    }
}

// ============================================================
// RGB NAME
// ============================================================

async function changeRGBName() {

    try {

        const guild =
            await client.guilds.fetch(
                GUILD_ID
            );

        if (!guild) {

            console.error(
                "❌ RGB : serveur introuvable."
            );

            return;
        }

        const botMember =
            await guild.members.fetch(
                client.user.id,
                {
                    force: true
                }
            );

        if (!botMember) {

            console.error(
                "❌ RGB : membre bot introuvable."
            );

            return;
        }

        const newName =
            RGB_NAMES[rgbIndex];

        console.log(
            `🌈 Changement du nom → ${newName}`
        );

        if (
            botMember.nickname === newName
        ) {

            console.log(
                `ℹ️ RGB : nom déjà identique → ${newName}`
            );

            rgbIndex =
                (
                    rgbIndex + 1
                ) %
                RGB_NAMES.length;

            return;
        }

        await botMember.setNickname(
            newName,
            "DAVID ANTI - RGB"
        );

        await sleep(500);

        let updatedMember =
            await guild.members.fetch({
                user: client.user.id,
                force: true
            });

        if (
            updatedMember.nickname === newName
        ) {

            console.log(
                `✅ Nom changé → ${newName}`
            );

        } else {

            console.log(
                `⚠️ RGB : changement non confirmé → ${newName}`
            );

            await sleep(1000);

            try {

                await botMember.setNickname(
                    newName,
                    "DAVID ANTI - RGB retry"
                );

            } catch (retryError) {

                console.error(
                    "❌ RGB retry :",
                    retryError.message
                );
            }

            await sleep(700);

            updatedMember =
                await guild.members.fetch({
                    user: client.user.id,
                    force: true
                });

            if (
                updatedMember.nickname === newName
            ) {

                console.log(
                    `✅ RGB retry réussi → ${newName}`
                );

            } else {

                console.log(
                    `❌ RGB : nom toujours non confirmé → ${newName}`
                );
            }
        }

        rgbIndex =
            (
                rgbIndex + 1
            ) %
            RGB_NAMES.length;

    } catch (error) {

        console.error(
            "❌ RGB erreur :",
            error.message
        );

        console.error(
            "❌ RGB code :",
            error.code || "N/A"
        );

        rgbIndex =
            (
                rgbIndex + 1
            ) %
            RGB_NAMES.length;
    }
}

// ============================================================
// START RGB
// ============================================================

function startRGB() {

    if (rgbStarted) {
        return;
    }

    rgbStarted = true;

    console.log(
        "🌈 RGB : démarrage..."
    );

    changeRGBName();

    setInterval(
        changeRGBName,
        RGB_DELAY
    );
}

// ============================================================
// SLASH COMMANDS
// ============================================================

const commands = [

    // --------------------------------------------------------
    // BOTINFO
    // --------------------------------------------------------

    new SlashCommandBuilder()
        .setName("botinfo")
        .setDescription(
            "🤖 Affiche les informations du bot."
        ),

    // --------------------------------------------------------
    // UPTIME
    // --------------------------------------------------------

    new SlashCommandBuilder()
        .setName("uptime")
        .setDescription(
            "⏱️ Affiche depuis combien de temps le bot est actif."
        )
];

// ============================================================
// READY
// ============================================================

client.once(
    "clientReady",
    async () => {

        console.log("");

        console.log(
            "===================================="
        );

        console.log(
            "       DAVID ANTI ONLINE"
        );

        console.log(
            "===================================="
        );

        console.log(
            `🤖 Connecté en tant que ${client.user.tag}`
        );

        console.log(
            `🆔 ID : ${client.user.id}`
        );

        console.log(
            `🌐 Serveurs : ${client.guilds.cache.size}`
        );

        console.log(
            `📦 Commandes : ${commands.length}`
        );

        console.log(
            `🟢 Node.js : ${process.version}`
        );

        console.log(
            `🧩 Discord.js : ${
                require("discord.js").version
            }`
        );

        // ====================================================
        // COMMANDES
        // ====================================================

        try {

            const guild =
                await client.guilds.fetch(
                    GUILD_ID
                );

            console.log(
                "🧹 Suppression des anciennes commandes serveur..."
            );

            await guild.commands.set([]);

            console.log(
                "✅ Anciennes commandes serveur supprimées."
            );

        } catch (error) {

            console.error(
                "❌ Nettoyage des commandes serveur :",
                error.message
            );
        }

        try {

            console.log(
                "📡 Enregistrement des commandes globales..."
            );

            await client.application.commands.set(
                commands
            );

            console.log(
                `✅ ${commands.length} commandes globales enregistrées.`
            );

        } catch (error) {

            console.error(
                "❌ Erreur commandes :",
                error.message
            );
        }

        // ====================================================
        // RGB
        // ====================================================

        startRGB();

        // ====================================================
        // HEARTBEAT
        // ====================================================

        setTimeout(
            sendHeartbeatToServer,
            5000
        );

        console.log(
            "💓 Heartbeat programmé."
        );

        console.log(
            "===================================="
        );

        console.log("");
    }
);

// ============================================================
// INTERACTIONS
// ============================================================

client.on(
    "interactionCreate",
    async interaction => {

        if (
            !interaction.isChatInputCommand()
        ) {
            return;
        }

        const command =
            interaction.commandName;

        console.log(
            `📥 Commande /${command} utilisée par ${interaction.user.tag}`
        );

        try {

            // =================================================
            // BOTINFO
            // =================================================

            if (
                command === "botinfo"
            ) {

                const memory =
                    process.memoryUsage();

                const embed =
                    new EmbedBuilder()
                        .setColor(0x5865f2)
                        .setTitle(
                            "🤖 DAVID ANTI"
                        )
                        .setThumbnail(
                            avatar(client.user)
                        )
                        .addFields(

                            {
                                name: "👤 Nom",
                                value:
                                    client.user.tag,
                                inline: true
                            },

                            {
                                name: "🆔 ID",
                                value:
                                    client.user.id,
                                inline: true
                            },

                            {
                                name: "🟢 Statut",
                                value:
                                    "ONLINE",
                                inline: true
                            },

                            {
                                name: "⏱️ Uptime",
                                value:
                                    formatUptime(
                                        Date.now() -
                                        BOT_START_TIME
                                    ),
                                inline: true
                            },

                            {
                                name: "📦 Discord.js",
                                value:
                                    require(
                                        "discord.js"
                                    ).version,
                                inline: true
                            },

                            {
                                name: "🟢 Node.js",
                                value:
                                    process.version,
                                inline: true
                            },

                            {
                                name: "💾 RAM",
                                value:
                                    formatBytes(
                                        memory.rss
                                    ),
                                inline: true
                            },

                            {
                                name: "🌐 Serveurs",
                                value:
                                    String(
                                        client.guilds
                                            .cache.size
                                    ),
                                inline: true
                            },

                            {
                                name: "📜 Commandes",
                                value:
                                    String(
                                        commands.length
                                    ),
                                inline: true
                            }
                        );

                await interaction.reply({
                    embeds: [
                        embed
                    ]
                });

                return;
            }

            // =================================================
            // UPTIME
            // =================================================

            if (
                command === "uptime"
            ) {

                await interaction.reply({

                    embeds: [

                        new EmbedBuilder()

                            .setColor(
                                0x00ff66
                            )

                            .setTitle(
                                "⏱️ DAVID ANTI UPTIME"
                            )

                            .setDescription(
                                `DAVID ANTI est en ligne depuis :\n\n**${
                                    formatUptime(
                                        Date.now() -
                                        BOT_START_TIME
                                    )
                                }**`
                            )
                    ]
                });

                return;
            }

        } catch (error) {

            console.error(
                `❌ Erreur /${command} :`,
                error
            );

            if (
                interaction.replied ||
                interaction.deferred
            ) {

                await interaction.followUp({
                    content:
                        "❌ Une erreur est survenue.",
                    ephemeral: true
                });

            } else {

                await interaction.reply({
                    content:
                        "❌ Une erreur est survenue.",
                    ephemeral: true
                });
            }
        }
    }
);

// ============================================================
// MESSAGE CREATE
// ============================================================

client.on(
    "messageCreate",
    async message => {

        if (message.author.bot) {
            return;
        }

        // ====================================================
        // ANTI-INSULTE / ANTI-NSFW
        // ====================================================
        //
        // Cette partie sera ajoutée ensuite.
        //
        // ====================================================
    }
);

// ============================================================
// TOKEN CHECK
// ============================================================

if (!TOKEN) {

    console.error(
        "❌ DISCORD_TOKEN est manquant !"
    );

    process.exit(1);
}

// ============================================================
// LOGIN
// ============================================================

client.login(TOKEN);
