const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const FormData = require('form-data');

// Configuration matching screenshot setup
const config = {
    botName: "LANEZ OS",
    antilink: {},
    antibadword: {},
    antidelete: {},
    warnings: {},
    poll: {}
};

function getUptime(startTime) {
    const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
}

function getMenu(startTime) {
    return `
╭───────────────⊷
│  🤖 LANEZ OS PRO BOT
│  Uptime: ${getUptime(startTime)}
│  Version: v2.0.0
│  Owner: LANEZ
╰───────────────⊷

┌─⊷ *Free Bot*
│ bot: most active
│ Owner: LANEZ
└───────────────⊷

╭──❏ *GROUP MANAGER* ❏
│ • ban <ban user>
│ • unban <unban user>
│ • promote <make admin>
│ • demote <remove admin>
│ • mute <disable chat>
│ • unmute <enable chat>
│ • kick <kick member>
│ • tagall <mention everyone>
│ • hidetag <silent tag all>
│ • jid <show group JID>
╰──────────────────⊷

╭──❏ *SECURITY* ❏
│ • antilink <on/off>
│ • warn <warn member>
╰──────────────────⊷

╭──❏ *AI MENU* ❏
│ • gpt <chat GPT>
│ • gemini <chat Gemini>
│ • imagine / dalle <AI image>
╰──────────────────⊷

╭──❏ *DOWNLOADER & MEDIA* ❏
│ • play <audio download>
│ • video / ytmp4 <video download>
│ • tiktok / tt <TikTok video>
│ • sticker / s <convert to sticker>
│ • toimg <sticker to image>
│ • vv2 / vv <view once cracker>
╰──────────────────⊷

╭──❏ *UTILITY & TOOLS* ❏
│ • ss / ssweb <website screenshot>
│ • tourl <upload media to link>
│ • 8ball <magic 8ball>
│ • compliment <send compliment>
│ • ping <check latency>
╰──────────────────⊷
`;
}

const commands = [
    // ====== MENU & SYSTEM ======
    {
        name: 'menu',
        aliases: ['help', 'commands'],
        exec: async ({ sock, from, startTime }) => {
            await sock.sendMessage(from, { text: getMenu(startTime) });
        }
    },
    {
        name: 'ping',
        exec: async ({ sock, from, startTime }) => {
            const start = Date.now();
            await sock.sendMessage(from, { text: '🏓 Testing speed...' });
            const latency = Date.now() - start;
            await sock.sendMessage(from, { text: `🏓 Pong! Latency: ${latency}ms\n⏱️ Uptime: ${getUptime(startTime)}` });
        }
    },

    // ====== VIEWONCE CRACKER (VV / VV2) ======
    {
        name: 'vv2',
        aliases: ['vv'],
        exec: async ({ sock, from, msg }) => {
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) return sock.sendMessage(from, { text: '❌ Reply to a ViewOnce message!' });

            const viewOnceMedia = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message;
            if (!viewOnceMedia) return sock.sendMessage(from, { text: '❌ Target message is not a ViewOnce media file.' });

            const type = Object.keys(viewOnceMedia)[0];
            const buffer = await downloadMediaMessage({ message: viewOnceMedia }, 'buffer', {});

            if (type.includes('image')) {
                return sock.sendMessage(from, { image: buffer, caption: '🔓 ViewOnce Unlocked' });
            } else if (type.includes('video')) {
                return sock.sendMessage(from, { video: buffer, caption: '🔓 ViewOnce Unlocked' });
            }
        }
    },

    // ====== DOWNLOADER & MEDIA ======
    {
        name: 'play',
        exec: async ({ sock, from, args }) => {
            const q = args.join(' ');
            if (!q) return sock.sendMessage(from, { text: '❌ Provide a song name! Example: .play Burna Boy' });
            await sock.sendMessage(from, { text: `🎵 Searching and fetching audio for: *${q}*...` });
            
            try {
                const res = await axios.get(`https://api.vreden.my.id/api/ytplay?query=${encodeURIComponent(q)}`);
                const downloadUrl = res.data?.result?.download?.url || res.data?.result?.url;
                if (downloadUrl) {
                    return sock.sendMessage(from, { audio: { url: downloadUrl }, mimetype: 'audio/mp4' });
                }
                return sock.sendMessage(from, { text: '❌ Could not retrieve audio stream.' });
            } catch (err) {
                return sock.sendMessage(from, { text: '❌ Failed to process YouTube audio request.' });
            }
        }
    },
    {
        name: 'video',
        aliases: ['ytmp4'],
        exec: async ({ sock, from, args }) => {
            const q = args.join(' ');
            if (!q) return sock.sendMessage(from, { text: '❌ Provide a video query or link!' });
            await sock.sendMessage(from, { text: `🎥 Downloading video for: *${q}*...` });

            try {
                const res = await axios.get(`https://api.vreden.my.id/api/ytplay?query=${encodeURIComponent(q)}`);
                const videoUrl = res.data?.result?.download?.videoUrl || res.data?.result?.url;
                if (videoUrl) {
                    return sock.sendMessage(from, { video: { url: videoUrl }, caption: '🎬 Download Complete' });
                }
                return sock.sendMessage(from, { text: '❌ Video download stream unavailable.' });
            } catch (err) {
                return sock.sendMessage(from, { text: '❌ Error fetching video.' });
            }
        }
    },
    {
        name: 'tiktok',
        aliases: ['tt'],
        exec: async ({ sock, from, args }) => {
            const url = args[0];
            if (!url || !url.includes('tiktok.com')) return sock.sendMessage(from, { text: '❌ Provide a valid TikTok link!' });

            try {
                const res = await axios.get(`https://api.vreden.my.id/api/tiktok?url=${encodeURIComponent(url)}`);
                const videoUrl = res.data?.result?.video || res.data?.result?.nowatermark;
                if (videoUrl) {
                    return sock.sendMessage(from, { video: { url: videoUrl }, caption: '🎵 TikTok Downloaded' });
                }
                return sock.sendMessage(from, { text: '❌ TikTok video extraction failed.' });
            } catch (err) {
                return sock.sendMessage(from, { text: '❌ Failed to process TikTok link.' });
            }
        }
    },
    {
        name: 'sticker',
        aliases: ['s'],
        exec: async ({ sock, from, msg }) => {
            const targetMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
            if (!targetMsg?.imageMessage && !targetMsg?.videoMessage) {
                return sock.sendMessage(from, { text: '❌ Send or reply to an image/video with .sticker' });
            }
            const buffer = await downloadMediaMessage({ message: targetMsg }, 'buffer', {});
            return sock.sendMessage(from, { sticker: buffer });
        }
    },
    {
        name: 'toimg',
        exec: async ({ sock, from, msg }) => {
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted?.stickerMessage) return sock.sendMessage(from, { text: '❌ Reply to a sticker to convert to image!' });

            const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {});
            return sock.sendMessage(from, { image: buffer, caption: '🖼️ Converted from Sticker' });
        }
    },

    // ====== AI GENERATION ======
    {
        name: 'imagine',
        aliases: ['dalle', 'flux'],
        exec: async ({ sock, from, args }) => {
            const prompt = args.join(' ');
            if (!prompt) return sock.sendMessage(from, { text: '❌ Provide a prompt! Example: .imagine futuristic city' });

            await sock.sendMessage(from, { text: '🎨 Generating image...' });
            const imgUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}`;
            return sock.sendMessage(from, { image: { url: imgUrl }, caption: `✨ *Prompt:* ${prompt}` });
        }
    },

    // ====== UTILITY & TOOLS ======
    {
        name: 'ss',
        aliases: ['ssweb'],
        exec: async ({ sock, from, args }) => {
            let url = args[0];
            if (!url) return sock.sendMessage(from, { text: '❌ Provide a website URL!' });
            if (!url.startsWith('http')) url = 'https://' + url;

            const ssUrl = `https://image.thum.io/get/width/1200/crop/800/${url}`;
            return sock.sendMessage(from, { image: { url: ssUrl }, caption: `🌐 Screenshot of: ${url}` });
        }
    },
    {
        name: 'tourl',
        exec: async ({ sock, from, msg }) => {
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
            if (!quoted?.imageMessage && !quoted?.videoMessage) {
                return sock.sendMessage(from, { text: '❌ Reply to an image or video to create a web link!' });
            }

            const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {});
            const form = new FormData();
            form.append('file', buffer, { filename: 'media.jpg' });

            try {
                const res = await axios.post('https://telegra.ph/upload', form, { headers: form.getHeaders() });
                const imgUrl = 'https://telegra.ph' + res.data[0].src;
                return sock.sendMessage(from, { text: `🔗 *Media URL:* ${imgUrl}` });
            } catch (e) {
                return sock.sendMessage(from, { text: '❌ Failed to upload media to server.' });
            }
        }
    },
    {
        name: '8ball',
        exec: async ({ sock, from, args }) => {
            if (!args.length) return sock.sendMessage(from, { text: '❌ Ask a question!' });
            const answers = ['Yes', 'No', 'Definitely', 'Ask again later', 'Outlook not good', 'Most likely'];
            const ans = answers[Math.floor(Math.random() * answers.length)];
            return sock.sendMessage(from, { text: `🎱 *8Ball Answer:* ${ans}` });
        }
    },
    {
        name: 'compliment',
        exec: async ({ sock, from }) => {
            return sock.sendMessage(from, { text: '✨ You are doing fantastic today! Keep up the great work.' });
        }
    },

    // ====== SECURITY & MODERATION ======
    {
        name: 'antilink',
        exec: async ({ sock, from, args, isGroup }) => {
            if (!isGroup) return sock.sendMessage(from, { text: '❌ Group command only.' });
            const status = args[0]?.toLowerCase();
            if (status === 'on') {
                config.antilink[from] = true;
                return sock.sendMessage(from, { text: '🛡️ Antilink enabled for this chat.' });
            } else if (status === 'off') {
                config.antilink[from] = false;
                return sock.sendMessage(from, { text: '🛡️ Antilink disabled for this chat.' });
            }
            return sock.sendMessage(from, { text: '❌ Use: .antilink on OR .antilink off' });
        }
    },
    {
        name: 'warn',
        exec: async ({ sock, from, msg, isGroup }) => {
            if (!isGroup) return sock.sendMessage(from, { text: '❌ Group command only.' });
            const user = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                         msg.message?.extendedTextMessage?.contextInfo?.participant;
            if (!user) return sock.sendMessage(from, { text: '❌ Mention or reply to a user to warn.' });

            config.warnings[user] = (config.warnings[user] || 0) + 1;
            const count = config.warnings[user];

            if (count >= 3) {
                await sock.sendMessage(from, { text: `⚠️ @${user.split('@')[0]} reached 3 warnings. Kicking...`, mentions: [user] });
                await sock.groupParticipantsUpdate(from, [user], 'remove');
                config.warnings[user] = 0;
            } else {
                await sock.sendMessage(from, { text: `⚠️ @${user.split('@')[0]} warned (${count}/3).`, mentions: [user] });
            }
        }
    },
    {
        name: 'kick',
        aliases: ['ban'],
        exec: async ({ sock, from, msg, isGroup }) => {
            if (!isGroup) return sock.sendMessage(from, { text: '❌ Group command only.' });
            const user = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                         msg.message?.extendedTextMessage?.contextInfo?.participant;
            if (!user) return sock.sendMessage(from, { text: '❌ Reply to or mention a member.' });

            await sock.groupParticipantsUpdate(from, [user], 'remove');
            return sock.sendMessage(from, { text: '🚪 Member removed.' });
        }
    },
    {
        name: 'promote',
        exec: async ({ sock, from, msg, isGroup }) => {
            if (!isGroup) return sock.sendMessage(from, { text: '❌ Group command only.' });
            const user = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                         msg.message?.extendedTextMessage?.contextInfo?.participant;
            if (!user) return sock.sendMessage(from, { text: '❌ Mention or reply to a user.' });

            await sock.groupParticipantsUpdate(from, [user], 'promote');
            return sock.sendMessage(from, { text: '👑 Member promoted to Admin.' });
        }
    },
    {
        name: 'demote',
        exec: async ({ sock, from, msg, isGroup }) => {
            if (!isGroup) return sock.sendMessage(from, { text: '❌ Group command only.' });
            const user = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                         msg.message?.extendedTextMessage?.contextInfo?.participant;
            if (!user) return sock.sendMessage(from, { text: '❌ Mention or reply to a user.' });

            await sock.groupParticipantsUpdate(from, [user], 'demote');
            return sock.sendMessage(from, { text: '📉 Member demoted from Admin.' });
        }
    },
    {
        name: 'tagall',
        exec: async ({ sock, from, isGroup }) => {
            if (!isGroup) return sock.sendMessage(from, { text: '❌ Group command only.' });
            const metadata = await sock.groupMetadata(from);
            const mentions = metadata.participants.map(p => p.id);
            let text = '📢 *ATTENTION EVERYONE*\n\n';
            mentions.forEach(m => text += `@${m.split('@')[0]}\n`);
            return sock.sendMessage(from, { text, mentions });
        }
    },
    {
        name: 'hidetag',
        exec: async ({ sock, from, args, isGroup }) => {
            if (!isGroup) return sock.sendMessage(from, { text: '❌ Group command only.' });
            const metadata = await sock.groupMetadata(from);
            const mentions = metadata.participants.map(p => p.id);
            return sock.sendMessage(from, { text: args.join(' ') || '📢 Group Announcement', mentions });
        }
    },
    {
        name: 'jid',
        exec: async ({ sock, from }) => {
            return sock.sendMessage(from, { text: `🆔 JID: \`${from}\`` });
        }
    }
];

module.exports = { commands, config };
                                   
