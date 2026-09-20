// ============================================================
// DAVID ANTI
// Discord Anti-Insulte / Anti-NSFW / Anti-Gore
// Avec analyse automatique des images
// ============================================================

const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder
} = require("discord.js");

const express = require("express");
const OpenAI = require("openai");

// ============================================================
// CONFIGURATION
// ============================================================

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const HEARTBEAT_SERVER_URL =
    process.env.HEARTBEAT_SERVER_URL ||
    "https://david-beat.onrender.com/heartbeat";

const HEARTBEAT_SECRET =
    process.env.HEARTBEAT_SECRET;

const OPENAI_API_KEY =
    process.env.OPENAI_API_KEY;

const ADMIN_ROLE_ID =
    "1550561028343865535";

const PORT =
    process.env.PORT || 10000;

// ============================================================
// VÉRIFICATIONS
// ============================================================

if (!DISCORD_TOKEN) {
    console.error("❌ DISCORD_TOKEN manquant.");
    process.exit(1);
}

if (!HEARTBEAT_SECRET) {
    console.warn("⚠️ HEARTBEAT_SECRET manquant.");
}

if (!OPENAI_API_KEY) {
    console.warn(
        "⚠️ OPENAI_API_KEY manquante : analyse des images désactivée."
    );
}

// ============================================================
// OPENAI
// ============================================================

const openai = OPENAI_API_KEY
    ? new OpenAI({
        apiKey: OPENAI_API_KEY
    })
    : null;

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
// VARIABLES
// ============================================================

const startTime = Date.now();

let heartbeatCount = 0;
let imageModerationCount = 0;
let imageBlockedCount = 0;

// ============================================================
// NOMS RGB
// ============================================================

const RGB_NAMES = [
    "🔴𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🔴",
    "🟠𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🟠",
    "🟡𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🟡",
    "🟢𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🟢",
    "🔵𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🔵",
    "🟣𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🟣",
    "⚫𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢⚫",
    "🟤𝐃𝐚𝐯𝐢𝐝 𝐀𝐧𝐭𝐢🟤"
];

let rgbIndex = 0;

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

    "porn",
    "porno",
    "pornographie",
    "pornographique",
    "xxx",
    "nsfw",
    "sexcam",

    "nude",
    "nudes",
    "nudité",
    "nudite",

    "masturbation",
    "masturber",

    "pénétration",
    "penetration",

    "gore",
    "décapitation",
    "decapitation",
    "démembrement",
    "demembrement"
];

// ============================================================
// DOMAINES INTERDITS
// ============================================================

const BLOCKED_DOMAINS = [
    "pornhub",
    "xvideos",
    "xnxx",
    "xhamster",
    "redtube"
];

// ============================================================
// NORMALISATION DU TEXTE
// ============================================================

function normalizeModerationText(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[@4]/g, "a")
        .replace(/[3€]/g, "e")
        .replace(/[1!|]/g, "i")
        .replace(/[0]/g, "o")
        .replace(/[5$]/g, "s")
        .replace(/[7]/g, "t")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

// ============================================================
// DÉTECTION DES MOTS
// ============================================================

function containsBlockedWord(text) {

    const cleanedText =
        normalizeModerationText(text);

    const words =
        cleanedText
            .split(/\s+/)
            .filter(Boolean);

    for (const word of BLOCKED_WORDS) {

        const normalizedWord =
            normalizeModerationText(word);

        // Mot exact
        if (words.includes(normalizedWord)) {

            return {
                detected: true,
                type: "mot interdit",
                word: word
            };
        }
    }

    // Détection de variantes séparées
    // Exemple :
    // c.o.n.n.a.r.d
    // c-o-n-n-a-r-d
    // c o n n a r d

    const compactText =
        cleanedText.replace(/\s+/g, "");

    for (const word of BLOCKED_WORDS) {

        const normalizedWord =
            normalizeModerationText(word);

        // On évite les petits mots comme "con"
        // pour empêcher les faux positifs.
        if (
            normalizedWord.length >= 4 &&
            compactText.includes(normalizedWord)
        ) {

            return {
                detected: true,
                type: "mot interdit",
                word: word
            };
        }
    }

    return {
        detected: false
    };
}

// ============================================================
// DÉTECTION DES DOMAINES
// ============================================================

function containsBlockedDomain(text) {

    const lower =
        text.toLowerCase();

    for (const domain of BLOCKED_DOMAINS) {

        if (lower.includes(domain)) {

            return {
                detected: true,
                type: "lien NSFW",
                domain: domain
            };
        }
    }

    return {
        detected: false
    };
}

// ============================================================
// VÉRIFICATION IMAGE
// ============================================================

function isImageAttachment(attachment) {

    if (
        attachment.contentType &&
        attachment.contentType.startsWith("image/")
    ) {
        return true;
    }

    const name =
        attachment.name?.toLowerCase() || "";

    return (
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".png") ||
        name.endsWith(".webp")
    );
}

// ============================================================
// MODÉRATION OPENAI
// ============================================================

async function moderateImage(imageUrl) {

    if (!openai) {

        console.log(
            "⚠️ Analyse image ignorée : OPENAI_API_KEY absente."
        );

        return {
            available: false,
            flagged: false
        };
    }

    try {

        imageModerationCount++;

        console.log(
            `🖼️ Analyse image OpenAI #${imageModerationCount}`
        );

        const moderation =
            await openai.moderations.create({

                model: "omni-moderation-latest",

                input: [
                    {
                        type: "image_url",

                        image_url: {
                            url: imageUrl
                        }
                    }
                ]
            });

        const result =
            moderation.results[0];

        if (!result) {

            console.log(
                "⚠️ OpenAI n'a renvoyé aucun résultat."
            );

            return {
                available: true,
                flagged: false
            };
        }

        const categories =
            result.categories || {};

        const sexual =
            Boolean(categories.sexual);

        const sexualMinors =
            Boolean(categories["sexual/minors"]);

        const violence =
            Boolean(categories.violence);

        const graphicViolence =
            Boolean(categories["violence/graphic"]);

        const flagged =
            Boolean(result.flagged) ||
            sexual ||
            sexualMinors ||
            violence ||
            graphicViolence;

        console.log(
            "🔎 Résultat image :",
            {
                flagged,
                sexual,
                sexualMinors,
                violence,
                graphicViolence
            }
        );

        return {
            available: true,
            flagged,
            sexual,
            sexualMinors,
            violence,
            graphicViolence
        };

    } catch (error) {

        console.error(
            "❌ Erreur OpenAI image :",
            error.message
        );

        return {
            available: false,
            flagged: false,
            error: error.message
        };
    }
}

// ============================================================
// TEMPS DE FONCTIONNEMENT
// ============================================================

function formatUptime(ms) {

    const seconds =
        Math.floor(ms / 1000);

    const days =
        Math.floor(seconds / 86400);

    const hours =
        Math.floor((seconds % 86400) / 3600);

    const minutes =
        Math.floor((seconds % 3600) / 60);

    const secs =
        seconds % 60;

    return `${days}j ${hours}h ${minutes}m ${secs}s`;
}

// ============================================================
// SERVEUR HTTP RENDER
// ============================================================

const app =
    express();

app.use(
    express.json()
);

// Page principale
app.get(
    "/",
    (req, res) => {

        res.status(200).json({
            bot: "DAVID ANTI",
            online: true,
            status: "online",
            uptime: formatUptime(
                Date.now() - startTime
            ),
            discord: client.isReady()
                ? "connected"
                : "connecting",
            openai: openai
                ? "enabled"
                : "disabled"
        });
    }
);

// Health check
app.get(
    "/health",
    (req, res) => {

        res.status(200).json({
            online: true,
            bot: "david-anti",
            uptime: Date.now() - startTime,
            discord: client.isReady(),
            heartbeat: heartbeatCount,
            imageModeration:
                openai
                    ? "enabled"
                    : "disabled"
        });
    }
);

// ============================================================
// ENDPOINT HEARTBEAT
// ============================================================

app.post(
    "/heartbeat",
    (req, res) => {

        const secret =
            req.headers["x-heartbeat-secret"];

        if (
            HEARTBEAT_SECRET &&
            secret !== HEARTBEAT_SECRET
        ) {

            return res
                .status(401)
                .json({
                    status: "unauthorized"
                });
        }

        heartbeatCount++;

        console.log(
            "💓 HEARTBEAT REÇU"
        );

        res.json({
            status: "ok",
            bot: "david-anti",
            online: true,
            uptime: Date.now() - startTime,
            heartbeat: heartbeatCount
        });
    }
);

// ============================================================
// DÉMARRAGE HTTP
// ============================================================

app.listen(
    PORT,
    () => {

        console.log(
            `🌐 HTTP server démarré sur le port ${PORT}`
        );
    }
);

// ============================================================
// ENVOI HEARTBEAT VERS DAVID-BEAT
// ============================================================

async function sendHeartbeat() {

    if (!HEARTBEAT_SERVER_URL) {
        return;
    }

    try {

        const response =
            await fetch(
                HEARTBEAT_SERVER_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "x-heartbeat-secret":
                            HEARTBEAT_SECRET || ""
                    },

                    body: JSON.stringify({
                        bot: "david-anti",
                        online: true,
                        uptime:
                            Date.now() - startTime,
                        timestamp:
                            new Date().toISOString()
                    })
                }
            );

        const data =
            await response.json()
                .catch(() => ({}));

        console.log(
            "💓 DAVID ANTI → HEARTBEAT SERVER",
            response.status,
            data
        );

    } catch (error) {

        console.error(
            "❌ Heartbeat impossible :",
            error.message
        );
    }
}

// Premier heartbeat après connexion
setTimeout(
    sendHeartbeat,
    15000
);

// Puis toutes les 60 secondes
setInterval(
    sendHeartbeat,
    60000
);

// ============================================================
// COMMANDES SLASH
// ============================================================

const commands = [

    new SlashCommandBuilder()
        .setName("botinfo")
        .setDescription(
            "Affiche les informations de DAVID ANTI"
        ),

    new SlashCommandBuilder()
        .setName("uptime")
        .setDescription(
            "Affiche depuis combien de temps DAVID ANTI est en ligne"
        )

].map(
    command => command.toJSON()
);

// ============================================================
// ENREGISTREMENT DES COMMANDES
// ============================================================

async function registerCommands() {

    try {

        if (!client.user) {
            return;
        }

        const rest =
            new REST({
                version: "10"
            }).setToken(
                DISCORD_TOKEN
            );

        await rest.put(
            Routes.applicationCommands(
                client.user.id
            ),
            {
                body: commands
            }
        );

        console.log(
            "✅ Commandes slash enregistrées."
        );

    } catch (error) {

        console.error(
            "❌ Erreur commandes slash :",
            error.message
        );
    }
}

// ============================================================
// READY
// ============================================================

client.once(
    "clientReady",
    async () => {

        console.log("");
        console.log(
            "=========================================="
        );
        console.log(
            "🛡️ DAVID ANTI CONNECTÉ"
        );
        console.log(
            "=========================================="
        );

        console.log(
            `👤 Connecté en tant que ${client.user.tag}`
        );

        console.log(
            `🆔 Bot ID : ${client.user.id}`
        );

        console.log(
            `🌐 Serveurs : ${client.guilds.cache.size}`
        );

        console.log(
            "🛡️ Anti-insulte / Anti-NSFW : ACTIVÉ"
        );

        console.log(
            "🖼️ Analyse images :",
            openai
                ? "ACTIVÉE"
                : "DÉSACTIVÉE"
        );

        console.log(
            "👑 Propriétaire du serveur : EXEMPTÉ"
        );

        console.log(
            "🛡️ Rôle équipe : EXEMPTÉ"
        );

        console.log(
            "=========================================="
        );
        console.log("");

        await registerCommands();

        // Première mise à jour du nom
        updateRGBName();

        // RGB toutes les 7 secondes
        setInterval(
            updateRGBName,
            7000
        );
    }
);

// ============================================================
// RGB NOM DU BOT
// ============================================================

async function updateRGBName() {

    if (!client.user) {
        return;
    }

    try {

        const name =
            RGB_NAMES[rgbIndex];

        rgbIndex =
            (rgbIndex + 1) %
            RGB_NAMES.length;

        for (
            const guild
            of client.guilds.cache.values()
        ) {

            try {

                const me =
                    guild.members.me;

                if (!me) {
                    continue;
                }

                await me.setNickname(
                    name
                );

            } catch (error) {

                console.log(
                    `⚠️ Impossible de changer le pseudo dans ${guild.name}: ${error.message}`
                );
            }
        }

    } catch (error) {

        console.error(
            "❌ RGB error :",
            error.message
        );
    }
}

// ============================================================
// COMMANDES
// ============================================================

client.on(
    "interactionCreate",
    async interaction => {

        if (!interaction.isChatInputCommand()) {
            return;
        }

        // --------------------------------------------
        // /uptime
        // --------------------------------------------

        if (
            interaction.commandName ===
            "uptime"
        ) {

            await interaction.reply({
                content:
                    `⏱️ **DAVID ANTI** est en ligne depuis **${formatUptime(Date.now() - startTime)}**.`,
                ephemeral: true
            });

            return;
        }

        // --------------------------------------------
        // /botinfo
        // --------------------------------------------

        if (
            interaction.commandName ===
            "botinfo"
        ) {

            await interaction.reply({
                content:
                    `🛡️ **DAVID ANTI**\n\n` +
                    `🤖 Discord : connecté\n` +
                    `🌐 Serveurs : ${client.guilds.cache.size}\n` +
                    `⏱️ Uptime : ${formatUptime(Date.now() - startTime)}\n` +
                    `📝 Anti-insulte : activé\n` +
                    `🔞 Anti-NSFW : activé\n` +
                    `🖼️ Analyse images : ${openai ? "activée" : "désactivée"}\n` +
                    `💓 Heartbeat : ${heartbeatCount}\n` +
                    `🖼️ Images analysées : ${imageModerationCount}\n` +
                    `🚨 Images bloquées : ${imageBlockedCount}`,
                ephemeral: true
            });

            return;
        }
    }
);

// ============================================================
// SUPPRESSION D'UN AVERTISSEMENT APRÈS 5 SECONDES
// ============================================================

async function deleteWarningAfter5Seconds(
    warning
) {

    setTimeout(
        async () => {

            try {

                await warning.delete();

            } catch {
                // Le message peut déjà avoir été supprimé.
            }

        },
        5000
    );
}

// ============================================================
// TRAITEMENT D'UNE INFRACTION
// ============================================================

async function handleDetection(
    message,
    detection
) {

    console.log("");
    console.log(
        "🚨 =================================="
    );

    console.log(
        "🚨 CONTENU INTERDIT DÉTECTÉ"
    );

    console.log(
        `👤 Utilisateur : ${message.author.tag}`
    );

    console.log(
        `🆔 ID : ${message.author.id}`
    );

    console.log(
        `📌 Serveur : ${message.guild.name}`
    );

    console.log(
        `📛 Type : ${detection.type}`
    );

    console.log(
        `🔎 Détection : ${detection.value || "image"}`
    );

    console.log(
        "🚨 =================================="
    );

    const isOwner =
        message.author.id ===
        message.guild.ownerId;

    const isAdminRole =
        message.member &&
        message.member.roles.cache.has(
            ADMIN_ROLE_ID
        );

    // ========================================================
    // PROPRIÉTAIRE
    // ========================================================

    if (isOwner) {

        console.log(
            `👑 PROPRIÉTAIRE AUTORISÉ | ${message.author.tag}`
        );

        console.log(
            "🛡️ Propriété détectée — ne pas tirer."
        );

        try {

            const warning =
                await message.channel.send(
                    "🛡️ **propriété détecter ne tire pas**"
                );

            deleteWarningAfter5Seconds(
                warning
            );

        } catch (error) {

            console.error(
                "❌ Message propriétaire :",
                error.message
            );
        }

        return;
    }

    // ========================================================
    // ADMIN / ÉQUIPE
    // ========================================================

    if (isAdminRole) {

        console.log(
            `🛡️ ADMIN / ÉQUIPE : ${message.author.tag}`
        );

        console.log(
            "🛡️ Ne pas tirer — il est l'un des nôtres."
        );

        try {

            const warning =
                await message.channel.send(
                    "🛡️ **ne tiré pas il est l'un des notre**"
                );

            deleteWarningAfter5Seconds(
                warning
            );

        } catch (error) {

            console.error(
                "❌ Message admin :",
                error.message
            );
        }

        return;
    }

    // ========================================================
    // MEMBRE NORMAL
    // ========================================================

    console.log(
        `🎯 CIBLE DÉTECTÉE : ${message.author.tag}`
    );

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
            error.code || "N/A"
        );

        return;
    }

    try {

        const warning =
            await message.channel.send(
                `🎯 **cible détecter suppression du message**\n<@${message.author.id}>`
            );

        console.log(
            "🎯 Avertissement cible envoyé."
        );

        deleteWarningAfter5Seconds(
            warning
        );

    } catch (error) {

        console.error(
            "❌ Impossible d'envoyer l'avertissement cible :",
            error.message
        );
    }
}

// ============================================================
// MESSAGE CREATE
// ============================================================

client.on(
    "messageCreate",
    async message => {

        // ----------------------------------------------------
        // Ignorer les bots
        // ----------------------------------------------------

        if (message.author.bot) {
            return;
        }

        console.log(
            `💬 MESSAGE REÇU | ${message.author.tag} | "${message.content}"`
        );

        // ----------------------------------------------------
        // Ignorer les messages privés
        // ----------------------------------------------------

        if (!message.guild) {

            console.log(
                "ℹ️ Message privé ignoré."
            );

            return;
        }

        // ----------------------------------------------------
        // 1. MODÉRATION DU TEXTE
        // ----------------------------------------------------

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
                ? {
                    type: wordResult.type,
                    value: wordResult.word
                }
                : domainResult.detected
                    ? {
                        type: domainResult.type,
                        value: domainResult.domain
                    }
                    : null;

        if (detection) {

            await handleDetection(
                message,
                detection
            );

            return;
        }

        // ----------------------------------------------------
        // 2. MODÉRATION DES IMAGES
        // ----------------------------------------------------

        const imageAttachments =
            [
                ...message.attachments.values()
            ].filter(
                isImageAttachment
            );

        if (
            imageAttachments.length === 0
        ) {

            console.log(
                "✅ Message autorisé."
            );

            return;
        }

        console.log(
            `🖼️ ${imageAttachments.length} image(s) détectée(s).`
        );

        // ----------------------------------------------------
        // Analyse des images une par une
        // ----------------------------------------------------

        for (
            const attachment
            of imageAttachments
        ) {

            // ------------------------------------------------
            // Limite 20 Mo
            // ------------------------------------------------

            if (
                attachment.size &&
                attachment.size > 20 * 1024 * 1024
            ) {

                console.log(
                    `⚠️ Image ignorée (>20 Mo) : ${attachment.name}`
                );

                continue;
            }

            const result =
                await moderateImage(
                    attachment.url
                );

            if (!result.available) {

                console.log(
                    "⚠️ Analyse image indisponible."
                );

                continue;
            }

            if (!result.flagged) {

                console.log(
                    `✅ Image autorisée : ${attachment.name}`
                );

                continue;
            }

            // --------------------------------------------
            // Image interdite
            // --------------------------------------------

            imageBlockedCount++;

            let detectedType =
                "image interdite";

            if (
                result.sexual ||
                result.sexualMinors
            ) {

                detectedType =
                    "image NSFW";
            }

            if (
                result.violence ||
                result.graphicViolence
            ) {

                detectedType =
                    "image violente / gore";
            }

            console.log(
                `🚨 IMAGE BLOQUÉE : ${detectedType}`
            );

            await handleDetection(
                message,
                {
                    type: detectedType,
                    value: attachment.name
                }
            );

            // Le message entier est supprimé.
            // On arrête donc après la première image interdite.
            return;
        }

        console.log(
            "✅ Images autorisées."
        );
    }
);

// ============================================================
// ERREURS DISCORD
// ============================================================

client.on(
    "error",
    error => {

        console.error(
            "❌ Discord client error :",
            error
        );
    }
);

// ============================================================
// WARNINGS
// ============================================================

process.on(
    "unhandledRejection",
    error => {

        console.error(
            "❌ Unhandled Rejection :",
            error
        );
    }
);

process.on(
    "uncaughtException",
    error => {

        console.error(
            "❌ Uncaught Exception :",
            error
        );
    }
);

// ============================================================
// CONNEXION DISCORD
// ============================================================

console.log(
    "🚀 Démarrage de DAVID ANTI..."
);

client.login(
    DISCORD_TOKEN
);
