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

// ============================================================
// RÔLE ADMIN / ÉQUIPE
// ============================================================

const ADMIN_ROLE_ID =
    "1550561028343865535";

// ============================================================
// HEARTBEAT
// ============================================================

const HEARTBEAT_SERVER_URL =
    process.env.HEARTBEAT_SERVER_URL;

const HEARTBEAT_SECRET =
    process.env.HEARTBEAT_SECRET;

const HEARTBEAT_DELAY = 10000;

const HEARTBEAT_RETRY_DELAY = 30000;

// ============================================================
// RGB
// ============================================================

const RGB_DELAY = 7000;

// ============================================================
// BOT START TIME
// ============================================================

const BOT_START_TIME = Date.now();

// ============================================================
// RGB NAMES
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
// DISCORD CLIENT
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

    let seconds =
        Math.floor(ms / 1000);

    const days =
        Math.floor(
            seconds / 86400
        );

    seconds %= 86400;

    const hours =
        Math.floor(
            seconds / 3600
        );

    seconds %= 3600;

    const minutes =
        Math.floor(
            seconds / 60
        );

    seconds %= 60;

    const parts = [];

    if (days) {
        parts.push(
            `${days}j`
        );
    }

    if (hours) {
        parts.push(
            `${hours}h`
        );
    }

    if (minutes) {
        parts.push(
            `${minutes}m`
        );
    }

    parts.push(
        `${seconds}s`
    );

    return parts.join(" ");
}

// ============================================================
// FORMAT RAM
// ============================================================

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

// ============================================================
// AVATAR
// ============================================================

function avatar(user) {

    return user.displayAvatarURL({

        extension: "png",

        size: 256

    });

}

// ============================================================
// HTTP SERVER
// ============================================================

const server =
    http.createServer(
        (req, res) => {

            // =================================================
            // HEARTBEAT
            // =================================================

            if (
                req.url ===
                "/heartbeat"
            ) {

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

                    res.writeHead(
                        401,
                        {
                            "Content-Type":
                                "application/json; charset=utf-8"
                        }
                    );

                    res.end(
                        JSON.stringify({

                            status:
                                "unauthorized",

                            heartbeat:
                                false,

                            bot:
                                "DAVID-ANTI"

                        })
                    );

                    return;

                }

                console.log(
                    "💓 Heartbeat reçu du HEARTBEAT SERVER"
                );

                res.writeHead(
                    200,
                    {
                        "Content-Type":
                            "application/json; charset=utf-8"
                    }
                );

                res.end(
                    JSON.stringify({

                        status:
                            "ok",

                        heartbeat:
                            true,

                        bot:
                            "DAVID-ANTI",

                        discord:
                            client.isReady(),

                        timestamp:
                            Date.now()

                    })
                );

                return;

            }

            // =================================================
            // PAGE PRINCIPALE
            // =================================================

            if (
                req.url === "/"
            ) {

                res.writeHead(
                    200,
                    {
                        "Content-Type":
                            "text/html; charset=utf-8"
                    }
                );

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

    border:
        1px solid #00ff66;

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
    Date.now() -
    BOT_START_TIME
)}

</p>

</div>

</body>

</html>

`);

                return;

            }

            // =================================================
            // 404
            // =================================================

            res.writeHead(
                404,
                {
                    "Content-Type":
                        "application/json; charset=utf-8"
                }
            );

            res.end(
                JSON.stringify({

                    error:
                        "Not Found"

                })
            );

        }
    );

// ============================================================
// START HTTP
// ============================================================

server.listen(

    process.env.PORT ||
    10000,

    "0.0.0.0",

    () => {

        console.log(

            `🌐 Serveur HTTP démarré sur le port ${
                process.env.PORT ||
                10000
            }`

        );

    }

);

// ============================================================
// HEARTBEAT → DAVID-BEAT
// ============================================================

async function sendHeartbeatToServer() {

    if (
        !HEARTBEAT_SERVER_URL
    ) {

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

        const response =
            await fetch(

                HEARTBEAT_SERVER_URL,

                {

                    method:
                        "GET",

                    headers: {

                        "Accept":
                            "application/json",

                        "Authorization":
                            `Bearer ${
                                HEARTBEAT_SECRET ||
                                ""
                            }`,

                        "User-Agent":
                            "DAVID-ANTI"

                    },

                    signal:
                        AbortSignal.timeout(
                            10000
                        )

                }

            );

        console.log(

            `💓 Réponse heartbeat : HTTP ${
                response.status
            }`

        );

        const responseText =
            await response.text();

        if (
            !response.ok
        ) {

            throw new Error(

                `HTTP ${
                    response.status
                } : ${
                    responseText.slice(
                        0,
                        200
                    )
                }`

            );

        }

        let data;

        try {

            data =
                JSON.parse(
                    responseText
                );

        } catch {

            throw new Error(

                `Réponse non-JSON reçue : ${
                    responseText.slice(
                        0,
                        200
                    )
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
                HEARTBEAT_RETRY_DELAY /
                1000
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
            RGB_NAMES[
                rgbIndex
            ];

        console.log(

            `🌈 Changement du nom → ${
                newName
            }`

        );

        if (
            botMember.nickname ===
            newName
        ) {

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

        console.log(

            `✅ Nom changé → ${
                newName
            }`

        );

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

            error.code ||
            "N/A"

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
// MOTS INTERDITS
// ============================================================

const BLOCKED_WORDS = [

    // --------------------------------------------------------
    // INSULTES
    // --------------------------------------------------------

    "con",
    "conne",
    "connard",
    "connasse",

    "abruti",
    "abrutie",

    "idiot",
    "idiote",

    "imbecile",
    "crétin",
    "cretin",
    "crétine",
    "cretine",

    "débile",
    "debile",

    "salaud",
    "salopard",
    "salop",

    "pute",
    "putain",

    "merde",
    "bordel",

    "enculé",
    "encule",

    "enculée",
    "enculee",

    "fdp",
    "ntm",
    "tg",

    "ta gueule",

    // --------------------------------------------------------
    // NSFW
    // --------------------------------------------------------

    "porn",
    "porno",

    "pornographie",
    "pornographique",

    "xxx",
    "nsfw",

    "sexcam",

    "nude",
    "nudes",

    "masturbation",
    "masturber",

    "pénétration",
    "penetration",

    // --------------------------------------------------------
    // GORE
    // --------------------------------------------------------

    "gore",

    "décapitation",
    "decapitation",

    "démembrement",
    "demembrement"

];

// ============================================================
// DOMAINES NSFW
// ============================================================

const BLOCKED_DOMAINS = [

    "pornhub",
    "xvideos",
    "xnxx",
    "xhamster",
    "redtube"

];

// ============================================================
// NORMALISATION
// ============================================================

function normalizeModerationText(text) {

    return text

        .toLowerCase()

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .replace(
            /[@4]/g,
            "a"
        )

        .replace(
            /[3€]/g,
            "e"
        )

        .replace(
            /[1!|]/g,
            "i"
        )

        .replace(
            /[0]/g,
            "o"
        )

        .replace(
            /[5$]/g,
            "s"
        )

        .replace(
            /[7]/g,
            "t"
        )

        .replace(
            /[^a-z0-9]+/g,
            " "
        )

        .trim();

}

// ============================================================
// DÉTECTION MOTS
// ============================================================

function containsBlockedWord(text) {

    const cleanedText =
        normalizeModerationText(
            text
        );

    const words =
        cleanedText
            .split(/\s+/)
            .filter(Boolean);

    // --------------------------------------------------------
    // MOTS ENTIERS
    // --------------------------------------------------------

    for (
        const word of BLOCKED_WORDS
    ) {

        const normalizedWord =
            normalizeModerationText(
                word
            );

        if (
            words.includes(
                normalizedWord
            )
        ) {

            return {

                detected:
                    true,

                type:
                    "mot interdit",

                word:
                    word

            };

        }

    }

    // --------------------------------------------------------
    // VARIANTES AVEC SÉPARATEURS
    // --------------------------------------------------------

    const compactText =
        cleanedText.replace(
            /\s+/g,
            ""
        );

    for (
        const word of BLOCKED_WORDS
    ) {

        const normalizedWord =
            normalizeModerationText(
                word
            );

        // Évite les faux positifs
        // pour les mots très courts.

        if (
            normalizedWord.length >= 4 &&
            compactText.includes(
                normalizedWord
            )
        ) {

            return {

                detected:
                    true,

                type:
                    "mot interdit",

                word:
                    word

            };

        }

    }

    return {

        detected:
            false

    };

}

// ============================================================
// DÉTECTION DOMAINES
// ============================================================

function containsBlockedDomain(text) {

    const lower =
        text.toLowerCase();

    for (
        const domain of BLOCKED_DOMAINS
    ) {

        if (
            lower.includes(
                domain
            )
        ) {

            return {

                detected:
                    true,

                type:
                    "lien NSFW",

                domain:
                    domain

            };

        }

    }

    return {

        detected:
            false

    };

}

// ============================================================
// SLASH COMMANDS
// ============================================================

const commands = [

    new SlashCommandBuilder()

        .setName(
            "botinfo"
        )

        .setDescription(
            "🤖 Affiche les informations du bot."
        ),

    new SlashCommandBuilder()

        .setName(
            "uptime"
        )

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
            "          DAVID ANTI ONLINE"
        );

        console.log(
            "===================================="
        );

        console.log(

            `🤖 Connecté en tant que ${
                client.user.tag
            }`

        );

        console.log(

            `🆔 ID : ${
                client.user.id
            }`

        );

        console.log(

            `🌐 Serveurs : ${
                client.guilds.cache.size
            }`

        );

        console.log(

            `📦 Commandes : ${
                commands.length
            }`

        );

        console.log(

            `🟢 Node.js : ${
                process.version
            }`

        );

        console.log(

            `🧩 Discord.js : ${
                require(
                    "discord.js"
                ).version
            }`

        );

        console.log(
            "🛡️ Anti-insulte / Anti-NSFW : ACTIVÉ"
        );

        console.log(
            `🛡️ Rôle équipe : ${ADMIN_ROLE_ID}`
        );

        console.log(
            "👑 Propriétaire : PROTÉGÉ"
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

                "❌ Nettoyage commandes :",

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

                `✅ ${
                    commands.length
                } commandes globales enregistrées.`

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

            `📥 Commande /${command} utilisée par ${
                interaction.user.tag
            }`

        );

        try {

            // =================================================
            // BOTINFO
            // =================================================

            if (
                command ===
                "botinfo"
            ) {

                const memory =
                    process.memoryUsage();

                const embed =
                    new EmbedBuilder()

                        .setColor(
                            0x5865f2
                        )

                        .setTitle(
                            "🤖 DAVID ANTI"
                        )

                        .setThumbnail(
                            avatar(
                                client.user
                            )
                        )

                        .addFields(

                            {

                                name:
                                    "👤 Nom",

                                value:
                                    client.user.tag,

                                inline:
                                    true

                            },

                            {

                                name:
                                    "🆔 ID",

                                value:
                                    client.user.id,

                                inline:
                                    true

                            },

                            {

                                name:
                                    "🟢 Statut",

                                value:
                                    "ONLINE",

                                inline:
                                    true

                            },

                            {

                                name:
                                    "⏱️ Uptime",

                                value:
                                    formatUptime(
                                        Date.now() -
                                        BOT_START_TIME
                                    ),

                                inline:
                                    true

                            },

                            {

                                name:
                                    "📦 Discord.js",

                                value:
                                    require(
                                        "discord.js"
                                    ).version,

                                inline:
                                    true

                            },

                            {

                                name:
                                    "🟢 Node.js",

                                value:
                                    process.version,

                                inline:
                                    true

                            },

                            {

                                name:
                                    "💾 RAM",

                                value:
                                    formatBytes(
                                        memory.rss
                                    ),

                                inline:
                                    true

                            },

                            {

                                name:
                                    "🌐 Serveurs",

                                value:
                                    String(
                                        client
                                            .guilds
                                            .cache
                                            .size
                                    ),

                                inline:
                                    true

                            },

                            {

                                name:
                                    "📜 Commandes",

                                value:
                                    String(
                                        commands.length
                                    ),

                                inline:
                                    true

                            },

                            {

                                name:
                                    "🛡️ Protection",

                                value:
                                    "Anti-insulte / Anti-NSFW",

                                inline:
                                    false

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
                command ===
                "uptime"
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

                    ephemeral:
                        true

                });

            } else {

                await interaction.reply({

                    content:
                        "❌ Une erreur est survenue.",

                    ephemeral:
                        true

                });

            }

        }

    }

);

// ============================================================
// MESSAGE CREATE — MODÉRATION
// ============================================================

client.on(

    "messageCreate",

    async message => {

        // ====================================================
        // IGNORE BOTS
        // ====================================================

        if (
            message.author.bot
        ) {

            return;

        }

        // ====================================================
        // DEBUG
        // ====================================================

        console.log(

            `💬 MESSAGE REÇU | ${
                message.author.tag
            } | "${message.content}"`

        );

        // ====================================================
        // IGNORE MP
        // ====================================================

        if (
            !message.guild
        ) {

            console.log(
                "ℹ️ Message privé ignoré."
            );

            return;

        }

        // ====================================================
        // DÉTECTION
        // ====================================================

        const wordResult =
            containsBlockedWord(
                message.content
            );

        const domainResult =
            containsBlockedDomain(
                message.content
            );

        const detection =
            wordResult.detected
                ? wordResult
                : domainResult;

        // ====================================================
        // MESSAGE NORMAL
        // ====================================================

        if (
            !detection.detected
        ) {

            console.log(
                "✅ Message autorisé."
            );

            return;

        }

        // ====================================================
        // LOG DÉTECTION
        // ====================================================

        console.log("");

        console.log(
            "🚨 =================================="
        );

        console.log(
            "🚨 CONTENU INTERDIT DÉTECTÉ"
        );

        console.log(

            `👤 Utilisateur : ${
                message.author.tag
            }`

        );

        console.log(

            `🆔 ID : ${
                message.author.id
            }`

        );

        console.log(

            `📌 Serveur : ${
                message.guild.name
            }`

        );

        console.log(

            `📛 Type : ${
                detection.type
            }`

        );

        console.log(

            `🔎 Détection : ${
                detection.word ||
                detection.domain ||
                "inconnue"
            }`

        );

        console.log(
            "🚨 =================================="
        );

        // ====================================================
        // VÉRIFICATION PROPRIÉTAIRE
        // ====================================================

        const isOwner =
            message.author.id ===
            message.guild.ownerId;

        // ====================================================
        // VÉRIFICATION RÔLE ADMIN
        // ====================================================

        const isAdminRole =
            message.member &&
            message.member.roles.cache.has(
                ADMIN_ROLE_ID
            );

        // ====================================================
        // PROPRIÉTAIRE
        // ====================================================

        if (
            isOwner
        ) {

            console.log(

                `👑 PROPRIÉTAIRE : ${
                    message.author.tag
                }`

            );

            console.log(
                "🛡️ Propriété détectée — ne pas tirer."
            );

            try {

                const warning =
                    await message.channel.send(
                        "🛡️ **propriété détecter ne tire pas**"
                    );

                setTimeout(

                    async () => {

                        try {

                            await warning.delete();

                        } catch {}

                    },

                    5000

                );

            } catch (error) {

                console.error(

                    "❌ Message propriétaire :",

                    error.message

                );

            }

            return;

        }

        // ====================================================
        // ADMIN / ÉQUIPE
        // ====================================================

        if (
            isAdminRole
        ) {

            console.log(

                `🛡️ ADMIN / ÉQUIPE : ${
                    message.author.tag
                }`

            );

            console.log(
                "🛡️ Ne pas tirer — il est l'un des nôtres."
            );

            try {

                const warning =
                    await message.channel.send(
                        "🛡️ **ne tiré pas il est l'un des notre**"
                    );

                setTimeout(

                    async () => {

                        try {

                            await warning.delete();

                        } catch {}

                    },

                    5000

                );

            } catch (error) {

                console.error(

                    "❌ Message admin :",

                    error.message

                );

            }

            return;

        }

        // ====================================================
        // CIBLE
        // ====================================================

        console.log(

            `🎯 CIBLE DÉTECTÉE : ${
                message.author.tag
            }`

        );

        // ====================================================
        // SUPPRESSION
        // ====================================================

        try {

            await message.delete();

            console.log(
                "🗑️ Message interdit supprimé."
            );

        } catch (error) {

            console.error(
                "❌ IMPOSSIBLE DE SUPPRIMER LE MESSAGE"
            );

            console.error(
                "❌ Erreur :",
                error.message
            );

            console.error(
                "❌ Code :",
                error.code ||
                "N/A"
            );

            return;

        }

        // ====================================================
        // AVERTISSEMENT CIBLE
        // ====================================================

        try {

            const warning =
                await message.channel.send(

                    `🎯 **cible détecter suppression du message**\n<@${message.author.id}>`

                );

            console.log(
                "🎯 Avertissement cible envoyé."
            );

            setTimeout(

                async () => {

                    try {

                        await warning.delete();

                    } catch {}

                },

                5000

            );

        } catch (error) {

            console.error(

                "❌ Impossible d'envoyer l'avertissement cible :",

                error.message

            );

        }

    }

);

// ============================================================
// TOKEN CHECK
// ============================================================

if (
    !TOKEN
) {

    console.error(
        "❌ DISCORD_TOKEN est manquant !"
    );

    process.exit(1);

}

// ============================================================
// LOGIN
// ============================================================

console.log(
    "🔐 Connexion à Discord..."
);

client.login(
    TOKEN
);
