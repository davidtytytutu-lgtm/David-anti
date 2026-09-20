const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,

    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,

    MessageFlags
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
    process.env.HEARTBEAT_SECRET || "";

const OPENAI_API_KEY =
    process.env.OPENAI_API_KEY || "";

const TEAM_ROLE_ID =
    "1550561028343865535";

const BOT_ID =
    "1551260698271813792";


// ============================================================
// CLIENT DISCORD
// ============================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});


// ============================================================
// EXPRESS
// ============================================================

const app = express();

const PORT =
    process.env.PORT || 10000;

app.use(express.json());


// ============================================================
// VARIABLES
// ============================================================

const startTime = Date.now();

let heartbeatCount = 0;

let lastHeartbeatReceived = null;

let lastHeartbeatStatus = "unknown";


// ============================================================
// OPENAI
// ============================================================

const openai = OPENAI_API_KEY
    ? new OpenAI({
        apiKey: OPENAI_API_KEY
    })
    : null;


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
// DÉTECTION MOTS
// ============================================================

function containsBlockedWord(text) {

    const normalized =
        normalizeModerationText(text);

    const words =
        normalized.split(/\s+/);

    for (const blocked of BLOCKED_WORDS) {

        const normalizedBlocked =
            normalizeModerationText(blocked);

        if (words.includes(normalizedBlocked)) {
            return true;
        }

        if (
            normalizedBlocked.length >= 4 &&
            normalized.includes(normalizedBlocked)
        ) {
            return true;
        }
    }

    return false;
}


// ============================================================
// DÉTECTION DOMAINES
// ============================================================

function containsBlockedDomain(text) {

    const normalized =
        text.toLowerCase();

    return BLOCKED_DOMAINS.some(
        domain =>
            normalized.includes(domain)
    );
}


// ============================================================
// FORMAT UPTIME
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

    if (seconds || parts.length === 0)
        parts.push(`${seconds}s`);

    return parts.join(" ");
}


// ============================================================
// FORMAT MÉMOIRE
// ============================================================

function formatMemory(bytes) {

    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}


// ============================================================
// LATENCE
// ============================================================

function getPing() {

    const ping =
        client.ws.ping;

    if (!Number.isFinite(ping) || ping < 0)
        return "—";

    return `${Math.round(ping)} ms`;
}


// ============================================================
// STATUT
// ============================================================

function getStatus() {

    if (!client.isReady())
        return {
            emoji: "🔴",
            text: "HORS LIGNE"
        };

    if (client.ws.ping > 500)
        return {
            emoji: "🟠",
            text: "LATENCE ÉLEVÉE"
        };

    return {
        emoji: "🟢",
        text: "OPÉRATIONNEL"
    };
}


// ============================================================
// COMPONENTS V2 — SÉPARATEUR
// ============================================================

function separator() {

    return new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(
            SeparatorSpacingSize.Small
        );
}


// ============================================================
// COMPONENTS V2 — BOTINFO
// ============================================================

function createBotInfoComponents() {

    const status =
        getStatus();

    const memory =
        process.memoryUsage();

    const guildCount =
        client.guilds.cache.size;

    const container =
        new ContainerBuilder()
            .setAccentColor(0x5865F2)

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        "# 🛡️ DAVID ANTI\n" +
                        "### Centre d'informations du bot\n" +
                        `${status.emoji} **${status.text}**`
                    )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        "## 🤖 IDENTITÉ\n" +
                        `**Nom**\n𝐃𝐚𝐯𝐢𝐝 𝐩𝐨𝐥𝐢𝐜𝐞#0704\n\n` +
                        `**ID**\n\`${BOT_ID}\`\n\n` +
                        `**Serveurs**\n\`${guildCount}\``
                    )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        "## ⚙️ SYSTÈME\n" +
                        `**Node.js**\n\`${process.version}\`\n\n` +
                        `**Discord.js**\n\`14.27.0\`\n\n` +
                        `**Latence**\n\`${getPing()}\`\n\n` +
                        `**Mémoire**\n\`${formatMemory(memory.rss)}\``
                    )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        "## 🛡️ PROTECTION\n" +
                        "🟢 **Anti-insulte** — Activé\n" +
                        "🟢 **Anti-NSFW** — Activé\n" +
                        "🟢 **Analyse d'images** — " +
                        `${openai ? "Activée" : "Désactivée"}\n` +
                        "🟢 **Protection du propriétaire** — Activée\n" +
                        "🟢 **Protection de l'équipe** — Activée"
                    )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        "## 💓 HEARTBEAT\n" +
                        `${lastHeartbeatStatus === "ok"
                            ? "🟢"
                            : "🟠"
                        } **Connexion**\n` +
                        `Signaux reçus : \`${heartbeatCount}\`\n` +
                        `Dernier signal : ${lastHeartbeatReceived
                            ? `<t:${Math.floor(
                                new Date(lastHeartbeatReceived).getTime() / 1000
                            )}:R>`
                            : "Aucun"}`
                    )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        "-# DAVID ANTI • Système de modération\n" +
                        `-# Démarré <t:${Math.floor(startTime / 1000)}:R>`
                    )
            );

    return [container];
}


// ============================================================
// COMPONENTS V2 — UPTIME
// ============================================================

function createUptimeComponents() {

    const status =
        getStatus();

    const uptime =
        formatUptime(
            Date.now() - startTime
        );

    const container =
        new ContainerBuilder()
            .setAccentColor(
                status.text === "OPÉRATIONNEL"
                    ? 0x57F287
                    : 0xFEE75C
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        "# 📡 DAVID ANTI — UPTIME\n" +
                        `### ${status.emoji} ${status.text}\n` +
                        "État actuel du système"
                    )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        "## ⏱️ DISPONIBILITÉ\n\n" +
                        `**Temps en ligne**\n` +
                        `\`${uptime}\`\n\n` +
                        `**Démarrage**\n` +
                        `<t:${Math.floor(startTime / 1000)}:F>\n` +
                        `<t:${Math.floor(startTime / 1000)}:R>`
                    )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        "## 📡 CONNEXION\n\n" +
                        `**WebSocket**\n\`${getPing()}\`\n\n` +
                        `**Serveurs Discord**\n\`${client.guilds.cache.size}\`\n\n` +
                        `**État Discord**\n` +
                        `${client.isReady()
                            ? "🟢 Connecté"
                            : "🔴 Déconnecté"}`
                    )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        "## 💓 HEARTBEAT\n\n" +
                        `**État**\n` +
                        `${lastHeartbeatStatus === "ok"
                            ? "🟢 Opérationnel"
                            : "🟠 En attente"}\n\n` +
                        `**Signaux reçus**\n` +
                        `\`${heartbeatCount}\`\n\n` +
                        `**Dernier signal**\n` +
                        `${lastHeartbeatReceived
                            ? `<t:${Math.floor(
                                new Date(lastHeartbeatReceived).getTime() / 1000
                            )}:R>`
                            : "Aucun"}`
                    )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        "## 🖥️ ENVIRONNEMENT\n\n" +
                        `**Node.js** — \`${process.version}\`\n` +
                        `**discord.js** — \`14.27.0\`\n` +
                        `**Analyse images** — ${openai
                            ? "🟢 Active"
                            : "🔴 Inactive"}`
                    )
            )

            .addSeparatorComponents(
                separator()
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `-# Dernière vérification : <t:${Math.floor(Date.now() / 1000)}:R>\n` +
                        "-# DAVID ANTI • Monitoring"
                    )
            );

    return [container];
}


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
            "Affiche l'état et le temps de fonctionnement"
        )
];


// ============================================================
// ENREGISTREMENT COMMANDES
// ============================================================

async function registerCommands() {

    const rest =
        new REST({
            version: "10"
        }).setToken(DISCORD_TOKEN);

    await rest.put(
        Routes.applicationCommands(
            BOT_ID
        ),
        {
            body: commands.map(
                command => command.toJSON()
            )
        }
    );

    console.log(
        "✅ Commandes slash enregistrées."
    );
}


// ============================================================
// INTERACTIONS
// ============================================================

client.on(
    "interactionCreate",
    async interaction => {

        if (!interaction.isChatInputCommand())
            return;

        try {

            if (interaction.commandName === "botinfo") {

                await interaction.reply({
                    components:
                        createBotInfoComponents(),

                    flags:
                        MessageFlags.IsComponentsV2
                });

                return;
            }


            if (interaction.commandName === "uptime") {

                await interaction.reply({
                    components:
                        createUptimeComponents(),

                    flags:
                        MessageFlags.IsComponentsV2
                });

                return;
            }

        } catch (error) {

            console.error(
                "❌ Erreur interaction :",
                error
            );

            if (!interaction.replied) {

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
// IMAGE
// ============================================================

function isImageAttachment(attachment) {

    if (
        attachment.contentType &&
        attachment.contentType.startsWith("image/")
    ) {
        return true;
    }

    return /\.(jpg|jpeg|png|webp)$/i.test(
        attachment.name || ""
    );
}


// ============================================================
// MODÉRATION IMAGE OPENAI
// ============================================================

async function moderateImage(
    attachment
) {

    if (!openai)
        return false;

    if (
        attachment.size &&
        attachment.size > 20 * 1024 * 1024
    ) {
        console.log(
            "⚠️ Image trop grande pour l'analyse."
        );

        return false;
    }

    try {

        const result =
            await openai.moderations.create({
                model: "omni-moderation-latest",

                input: [
                    {
                        type: "image_url",
                        image_url: {
                            url: attachment.url
                        }
                    }
                ]
            });

        const moderation =
            result.results?.[0];

        if (!moderation)
            return false;

        const categories =
            moderation.categories || {};

        return Boolean(
            moderation.flagged ||
            categories.sexual ||
            categories["sexual/minors"] ||
            categories.violence ||
            categories["violence/graphic"]
        );

    } catch (error) {

        console.error(
            "❌ Erreur analyse image :",
            error.message
        );

        return false;
    }
}


// ============================================================
// MODÉRATION MESSAGE
// ============================================================

client.on(
    "messageCreate",
    async message => {

        try {

            if (message.author.bot)
                return;

            if (!message.guild)
                return;


            let blocked =
                containsBlockedWord(
                    message.content
                ) ||
                containsBlockedDomain(
                    message.content
                );


            if (!blocked) {

                for (
                    const attachment
                    of message.attachments.values()
                ) {

                    if (
                        isImageAttachment(
                            attachment
                        )
                    ) {

                        const flagged =
                            await moderateImage(
                                attachment
                            );

                        if (flagged) {
                            blocked = true;
                            break;
                        }
                    }
                }
            }


            if (!blocked)
                return;


            const isOwner =
                message.author.id ===
                message.guild.ownerId;


            const isTeam =
                message.member?.roles.cache.has(
                    TEAM_ROLE_ID
                );


            // ================================================
            // PROPRIÉTAIRE
            // ================================================

            if (isOwner) {

                const warning =
                    await message.channel.send(
                        "🛡️ propriété détecter ne tire pas"
                    );

                setTimeout(
                    () => warning.delete().catch(() => {}),
                    5000
                );

                return;
            }


            // ================================================
            // ÉQUIPE
            // ================================================

            if (isTeam) {

                const warning =
                    await message.channel.send(
                        "🛡️ ne tiré pas il est l'un des notre"
                    );

                setTimeout(
                    () => warning.delete().catch(() => {}),
                    5000
                );

                return;
            }


            // ================================================
            // UTILISATEUR NORMAL
            // ================================================

            await message.delete()
                .catch(() => {});


            const warning =
                await message.channel.send(
                    "🎯 cible détecter suppression du message"
                );

            setTimeout(
                () => warning.delete().catch(() => {}),
                5000
            );

        } catch (error) {

            console.error(
                "❌ Erreur modération :",
                error
            );
        }
    }
);


// ============================================================
// HEARTBEAT REÇU
// ============================================================

app.post(
    "/heartbeat",
    (req, res) => {

        const secret =
            req.headers[
                "x-heartbeat-secret"
            ];

        if (
            HEARTBEAT_SECRET &&
            secret !== HEARTBEAT_SECRET
        ) {

            console.log(
                "🚫 Heartbeat refusé : secret incorrect"
            );

            return res.status(401).json({
                status: "unauthorized"
            });
        }


        heartbeatCount++;

        lastHeartbeatReceived =
            new Date().toISOString();

        lastHeartbeatStatus =
            "ok";


        console.log("");
        console.log(
            "💓 =================================="
        );
        console.log(
            "💓 HEARTBEAT REÇU"
        );
        console.log(
            `💓 Nombre : ${heartbeatCount}`
        );
        console.log(
            `💓 Heure : ${lastHeartbeatReceived}`
        );
        console.log(
            "💓 =================================="
        );


        res.status(200).json({

            status: "ok",

            bot: "david-anti",

            online: client.isReady(),

            uptime:
                Math.floor(
                    (Date.now() - startTime) /
                    1000
                ),

            heartbeat:
                heartbeatCount
        });
    }
);


// ============================================================
// ENDPOINT ROOT
// ============================================================

app.get(
    "/",
    (req, res) => {

        res.json({

            service: "DAVID ANTI",

            status:
                client.isReady()
                    ? "online"
                    : "starting",

            bot:
                client.user?.tag ||
                "starting",

            uptime:
                formatUptime(
                    Date.now() - startTime
                ),

            heartbeat:
                heartbeatCount
        });
    }
);


// ============================================================
// DÉMARRAGE HTTP
// ============================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🌐 HTTP server démarré sur le port ${PORT}`
        );
    }
);


// ============================================================
// HEARTBEAT → DAVID BEAT
// ============================================================

async function sendHeartbeat() {

    if (!HEARTBEAT_SERVER_URL)
        return;

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
                            HEARTBEAT_SECRET
                    },

                    body: JSON.stringify({

                        bot:
                            "david-anti",

                        botId:
                            BOT_ID,

                        timestamp:
                            new Date().toISOString()
                    })
                }
            );


        const data =
            await response
                .json()
                .catch(() => ({}));


        console.log(
            `💓 DAVID ANTI → HEARTBEAT SERVER ${response.status}`,
            data
        );

    } catch (error) {

        console.error(
            "❌ Heartbeat error :",
            error.message
        );
    }
}


// ============================================================
// READY
// ============================================================

client.once(
    "ready",
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
            `🖼️ Analyse images : ${
                openai
                    ? "ACTIVÉE"
                    : "DÉSACTIVÉE"
            }`
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


        try {

            await registerCommands();

        } catch (error) {

            console.error(
                "❌ Impossible d'enregistrer les commandes :",
                error
            );
        }


        setTimeout(
            sendHeartbeat,
            5000
        );

        setInterval(
            sendHeartbeat,
            5000
        );
    }
);


// ============================================================
// ERREURS
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
// CONNEXION
// ============================================================

if (!DISCORD_TOKEN) {

    console.error(
        "❌ DISCORD_TOKEN manquant."
    );

    process.exit(1);
}


client.login(
    DISCORD_TOKEN
);
