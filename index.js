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
// IMAGE MODERATION
// ============================================================

const HF_TOKEN =
    process.env.HF_TOKEN;

// Modèle :
// SFW / NSFW / NSFL
//
// NSFW = contenu sexuel/adulte
// NSFL = gore / contenu violent
//
// L'URL peut être modifiée via Render si nécessaire.

const IMAGE_MODEL =
    process.env.IMAGE_MODEL ||
    "OwenElliott/image-safety-classifier-m";

const IMAGE_API_URL =
    process.env.IMAGE_API_URL ||
    `https://router.huggingface.co/hf-inference/models/${IMAGE_MODEL}`;

// Score à partir duquel l'image est considérée interdite.

const NSFW_THRESHOLD = 0.70;

const NSFL_THRESHOLD = 0.70;

// Taille maximale analysée : 10 MB

const MAX_IMAGE_SIZE =
    10 * 1024 * 1024;

// ============================================================
// RGB
// ============================================================

const RGB_DELAY = 7000;

const RGB_NAMES = [

    "🔴𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🔴",

    "🟠𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🟠",

    "🟡𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🟡",

    "🟢𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🟢",

    "🔵𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🔵",

    "🟣𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🟣",

    "⚫𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢⚫"

];

let rgbIndex = 0;

let rgbStarted = false;

// ============================================================
// START TIME
// ============================================================

const BOT_START_TIME = Date.now();

// ============================================================
// CLIENT
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
// UPTIME
// ============================================================

function formatUptime(ms) {

    let seconds =
        Math.floor(ms / 1000);

    const days =
        Math.floor(seconds / 86400);

    seconds %= 86400;

    const hours =
        Math.floor(seconds / 3600);

    seconds %= 3600;

    const minutes =
        Math.floor(seconds / 60);

    seconds %= 60;

    const parts = [];

    if (days)
        parts.push(`${days}j`);

    if (hours)
        parts.push(`${hours}h`);

    if (minutes)
        parts.push(`${minutes}m`);

    parts.push(`${seconds}s`);

    return parts.join(" ");
}

// ============================================================
// BYTES
// ============================================================

function formatBytes(bytes) {

    if (!bytes)
        return "0 B";

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
                req.url === "/heartbeat"
            ) {

                const authorization =
                    req.headers.authorization;

                if (
                    HEARTBEAT_SECRET &&
                    authorization !==
                    `Bearer ${HEARTBEAT_SECRET}`
                ) {

                    console.log(
                        "🚫 Heartbeat refusé."
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
                                false

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
            // PAGE
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

    background:#050505;

    color:#00ff66;

    font-family:monospace;

    text-align:center;

    padding-top:80px;

}

.box {

    border:1px solid #00ff66;

    padding:30px;

    max-width:600px;

    margin:auto;

}

h1 {

    font-size:42px;

}

</style>

</head>

<body>

<div class="box">

<h1>🛡️ DAVID ANTI</h1>

<p>🟢 ONLINE</p>

<p>Anti-insulte / Anti-NSFW / Anti-GORE</p>

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
                        "application/json"
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
// HTTP START
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
// HEARTBEAT
// ============================================================

async function sendHeartbeatToServer() {

    if (
        !HEARTBEAT_SERVER_URL
    ) {

        console.error(
            "❌ HEARTBEAT_SERVER_URL manquant."
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

        const text =
            await response.text();

        if (
            !response.ok
        ) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        let data;

        try {

            data =
                JSON.parse(text);

        } catch {

            throw new Error(
                "Réponse heartbeat non-JSON"
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

        setTimeout(
            sendHeartbeatToServer,
            HEARTBEAT_RETRY_DELAY
        );

    }

}

// ============================================================
// RGB
// ============================================================

async function changeRGBName() {

    try {

        const guild =
            await client.guilds.fetch(
                GUILD_ID
            );

        const botMember =
            await guild.members.fetch(
                client.user.id,
                {
                    force: true
                }
            );

        const newName =
            RGB_NAMES[rgbIndex];

        console.log(
            `🌈 Changement du nom → ${newName}`
        );

        await botMember.setNickname(
            newName,
            "DAVID ANTI - RGB"
        );

        console.log(
            `✅ Nom changé → ${newName}`
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

    if (rgbStarted)
        return;

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

    // NSFW texte

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

    // GORE texte

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
// MOTS
// ============================================================

function containsBlockedWord(text) {

    const cleaned =
        normalizeModerationText(
            text
        );

    const words =
        cleaned
            .split(/\s+/)
            .filter(Boolean);

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

                word

            };

        }

    }

    const compact =
        cleaned.replace(
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

        if (
            normalizedWord.length >= 4 &&
            compact.includes(
                normalizedWord
            )
        ) {

            return {

                detected:
                    true,

                type:
                    "mot interdit",

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
// DOMAINES
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
// IMAGE : TYPE
// ============================================================

function isImageAttachment(attachment) {

    if (
        attachment.contentType &&
        attachment.contentType
            .toLowerCase()
            .startsWith("image/")
    ) {

        return true;

    }

    const name =
        (
            attachment.name ||
            ""
        ).toLowerCase();

    return (

        name.endsWith(".jpg") ||

        name.endsWith(".jpeg") ||

        name.endsWith(".png") ||

        name.endsWith(".webp") ||

        name.endsWith(".gif") ||

        name.endsWith(".bmp")

    );

}

// ============================================================
// IMAGE : MODÉRATION IA
// ============================================================

async function moderateImage(
    attachment
) {

    // ========================================================
    // TOKEN
    // ========================================================

    if (!HF_TOKEN) {

        console.error(
            "❌ HF_TOKEN n'est pas configuré."
        );

        return {

            detected:
                false,

            error:
                true,

            reason:
                "HF_TOKEN_MISSING"

        };

    }

    // ========================================================
    // TAILLE
    // ========================================================

    if (
        attachment.size &&
        attachment.size >
        MAX_IMAGE_SIZE
    ) {

        console.log(

            `⚠️ Image ignorée car trop grande : ${
                formatBytes(
                    attachment.size
                )
            }`

        );

        return {

            detected:
                false,

            skipped:
                true,

            reason:
                "IMAGE_TOO_LARGE"

        };

    }

    console.log("");

    console.log(
        "🖼️ ANALYSE IMAGE"
    );

    console.log(
        `📁 Nom : ${attachment.name}`
    );

    console.log(
        `📦 Taille : ${
            formatBytes(
                attachment.size
            )
        }`
    );

    console.log(
        `🤖 Modèle : ${IMAGE_MODEL}`
    );

    try {

        // ====================================================
        // TÉLÉCHARGEMENT
        // ====================================================

        const imageResponse =
            await fetch(
                attachment.url,
                {

                    signal:
                        AbortSignal.timeout(
                            15000
                        )

                }
            );

        if (
            !imageResponse.ok
        ) {

            throw new Error(

                `Téléchargement image HTTP ${
                    imageResponse.status
                }`

            );

        }

        const contentLength =
            Number(
                imageResponse.headers
                    .get(
                        "content-length"
                    ) ||
                    0
            );

        if (
            contentLength >
            MAX_IMAGE_SIZE
        ) {

            return {

                detected:
                    false,

                skipped:
                    true,

                reason:
                    "IMAGE_TOO_LARGE"

            };

        }

        const imageBuffer =
            Buffer.from(
                await imageResponse.arrayBuffer()
            );

        if (
            imageBuffer.length >
            MAX_IMAGE_SIZE
        ) {

            return {

                detected:
                    false,

                skipped:
                    true,

                reason:
                    "IMAGE_TOO_LARGE"

            };

        }

        // ====================================================
        // ENVOI AU MODÈLE
        // ====================================================

        const aiResponse =
            await fetch(
                IMAGE_API_URL,
                {

                    method:
                        "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${HF_TOKEN}`,

                        "Content-Type":
                            attachment.contentType ||
                            "application/octet-stream",

                        "Accept":
                            "application/json"

                    },

                    body:
                        imageBuffer,

                    signal:
                        AbortSignal.timeout(
                            30000
                        )

                }
            );

        const responseText =
            await aiResponse.text();

        if (
            !aiResponse.ok
        ) {

            throw new Error(

                `Hugging Face HTTP ${
                    aiResponse.status
                } : ${
                    responseText.slice(
                        0,
                        300
                    )
                }`

            );

        }

        let results;

        try {

            results =
                JSON.parse(
                    responseText
                );

        } catch {

            throw new Error(
                "Réponse IA invalide."
            );

        }

        // ====================================================
        // NORMALISATION RÉSULTATS
        // ====================================================

        let predictions = [];

        if (
            Array.isArray(results)
        ) {

            predictions =
                results;

        } else if (
            results &&
            Array.isArray(
                results.predictions
            )
        ) {

            predictions =
                results.predictions;

        }

        // Certains modèles peuvent
        // renvoyer des tableaux imbriqués.

        if (
            predictions.length === 1 &&
            Array.isArray(
                predictions[0]
            )
        ) {

            predictions =
                predictions[0];

        }

        console.log(
            "🤖 Résultats IA :",
            predictions
        );

        // ====================================================
        // SCORES
        // ====================================================

        let nsfwScore = 0;

        let nsflScore = 0;

        let sfwScore = 0;

        for (
            const prediction
            of predictions
        ) {

            const label =
                String(
                    prediction.label ||
                    prediction.class ||
                    ""
                )
                .toLowerCase();

            const score =
                Number(
                    prediction.score ||
                    prediction.confidence ||
                    0
                );

            if (
                label.includes("nsfw")
            ) {

                nsfwScore =
                    Math.max(
                        nsfwScore,
                        score
                    );

            }

            if (
                label.includes("nsfl")
            ) {

                nsflScore =
                    Math.max(
                        nsflScore,
                        score
                    );

            }

            if (
                label === "sfw" ||
                label.includes("safe")
            ) {

                sfwScore =
                    Math.max(
                        sfwScore,
                        score
                    );

            }

        }

        console.log(
            `🔞 NSFW : ${(
                nsfwScore * 100
            ).toFixed(2)}%`
        );

        console.log(
            `🩸 NSFL/GORE : ${(
                nsflScore * 100
            ).toFixed(2)}%`
        );

        console.log(
            `✅ SFW : ${(
                sfwScore * 100
            ).toFixed(2)}%`
        );

        // ====================================================
        // DÉCISION
        // ====================================================

        if (
            nsfwScore >=
            NSFW_THRESHOLD
        ) {

            return {

                detected:
                    true,

                type:
                    "image NSFW",

                score:
                    nsfwScore,

                label:
                    "NSFW"

            };

        }

        if (
            nsflScore >=
            NSFL_THRESHOLD
        ) {

            return {

                detected:
                    true,

                type:
                    "image GORE / NSFL",

                score:
                    nsflScore,

                label:
                    "NSFL"

            };

        }

        return {

            detected:
                false,

            score:
                Math.max(
                    nsfwScore,
                    nsflScore
                ),

            label:
                "SFW"

        };

    } catch (error) {

        console.error(
            "❌ Erreur analyse image :",
            error.message
        );

        return {

            detected:
                false,

            error:
                true,

            reason:
                error.message

        };

    }

}

// ============================================================
// ANALYSER TOUTES LES IMAGES
// ============================================================

async function moderateMessageImages(
    message
) {

    if (
        !message.attachments ||
        message.attachments.size === 0
    ) {

        return {

            detected:
                false

        };

    }

    const images =
        message.attachments
            .filter(
                attachment =>
                    isImageAttachment(
                        attachment
                    )
            );

    if (
        images.size === 0
    ) {

        return {

            detected:
                false

        };

    }

    console.log(
        `🖼️ ${images.size} image(s) à analyser.`
    );

    for (
        const [
            id,
            attachment
        ]
        of images
    ) {

        console.log(
            `🔍 Analyse image ${id}...`
        );

        const result =
            await moderateImage(
                attachment
            );

        if (
            result.detected
        ) {

            return {

                detected:
                    true,

                ...result,

                attachment

            };

        }

    }

    return {

        detected:
            false

    };

}

// ============================================================
// COMMANDES
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
                require("discord.js").version
            }`
        );

        console.log(
            "🛡️ Anti-insulte : ACTIVÉ"
        );

        console.log(
            "🔞 Anti-NSFW texte : ACTIVÉ"
        );

        console.log(
            "🖼️ Anti-NSFW image : ACTIVÉ"
        );

        console.log(
            "🩸 Anti-GORE image : ACTIVÉ"
        );

        console.log(
            `🛡️ Rôle équipe : ${
                ADMIN_ROLE_ID
            }`
        );

        console.log(
            `🤖 Modèle image : ${
                IMAGE_MODEL
            }`
        );

        if (!HF_TOKEN) {

            console.log(
                "⚠️ HF_TOKEN MANQUANT — analyse image désactivée."
            );

        } else {

            console.log(
                "✅ HF_TOKEN détecté — analyse image disponible."
            );

        }

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

        try {

            // =================================================
            // BOTINFO
            // =================================================

            if (
                interaction.commandName ===
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
                                    "🛡️ Protection",

                                value:
                                    "Insultes • NSFW • GORE • Images",

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
                interaction.commandName ===
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

            }

        } catch (error) {

            console.error(
                "❌ Interaction :",
                error.message
            );

        }

    }

);

// ============================================================
// MESSAGE CREATE
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
        // LOG
        // ====================================================

        console.log(

            `💬 MESSAGE REÇU | ${
                message.author.tag
            } | "${message.content}"`

        );

        // ====================================================
        // MP
        // ====================================================

        if (
            !message.guild
        ) {

            return;

        }

        // ====================================================
        // OWNER
        // ====================================================

        const isOwner =
            message.author.id ===
            message.guild.ownerId;

        // ====================================================
        // ADMIN
        // ====================================================

        const isAdminRole =
            message.member &&
            message.member.roles.cache.has(
                ADMIN_ROLE_ID
            );

        // ====================================================
        // DÉTECTION TEXTE
        // ====================================================

        const wordResult =
            containsBlockedWord(
                message.content
            );

        const domainResult =
            containsBlockedDomain(
                message.content
            );

        let detection =
            wordResult.detected
                ? wordResult
                : domainResult;

        // ====================================================
        // DÉTECTION IMAGE
        // ====================================================

        if (
            !detection.detected
        ) {

            const imageResult =
                await moderateMessageImages(
                    message
                );

            if (
                imageResult.detected
            ) {

                detection =
                    imageResult;

            }

        }

        // ====================================================
        // AUTORISÉ
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
        // LOG
        // ====================================================

        console.log("");

        console.log(
            "🚨 =================================="
        );

        console.log(
            "🚨 CONTENU INTERDIT DÉTECTÉ"
        );

        console.log(
            `👤 ${message.author.tag}`
        );

        console.log(
            `🆔 ${message.author.id}`
        );

        console.log(
            `📛 Type : ${
                detection.type
            }`
        );

        if (
            detection.word
        ) {

            console.log(
                `🔎 Mot : ${
                    detection.word
                }`
            );

        }

        if (
            detection.label
        ) {

            console.log(
                `🤖 IA : ${
                    detection.label
                }`
            );

        }

        if (
            detection.score
        ) {

            console.log(
                `📊 Score : ${
                    (
                        detection.score *
                        100
                    ).toFixed(2)
                }%`
            );

        }

        console.log(
            "🚨 =================================="
        );

        // ====================================================
        // OWNER
        // ====================================================

        if (
            isOwner
        ) {

            console.log(
                "👑 PROPRIÉTAIRE AUTORISÉ"
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
                    "❌ Warning owner :",
                    error.message
                );

            }

            return;

        }

        // ====================================================
        // ADMIN
        // ====================================================

        if (
            isAdminRole
        ) {

            console.log(
                "🛡️ MEMBRE DE L'ÉQUIPE AUTORISÉ"
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
                    "❌ Warning admin :",
                    error.message
                );

            }

            return;

        }

        // ====================================================
        // CIBLE
        // ====================================================

        console.log(
            "🎯 CIBLE DÉTECTÉE"
        );

        // ====================================================
        // SUPPRESSION
        // ====================================================

        try {

            await message.delete();

            console.log(
                "🗑️ Message supprimé."
            );

        } catch (error) {

            console.error(
                "❌ Impossible de supprimer :",
                error.message
            );

            return;

        }

        // ====================================================
        // MESSAGE
        // ====================================================

        try {

            const warning =
                await message.channel.send(

                    `🎯 **cible détecter suppression du message**\n<@${message.author.id}>`

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
                "❌ Warning cible :",
                error.message
            );

        }

    }

);

// ============================================================
// TOKEN
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

console.log(
    "🔐 Connexion à Discord..."
);

client.login(
    TOKEN
);
