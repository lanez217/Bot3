const axios = require('axios');
const FormData = require('form-data');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

const config = {
    botName: "LANEZ OS",
    antilink: {},
    warnings: {}
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

╭──❏ *GROUP MANAGER* ❏
│ • kick <kick member>
│ • promote <make admin>
│ • demote <remove admin>
│ • tagall <mention everyone>
│ • hidetag <silent tag all>
│ • jid <show group JID>
╰──────────────────⊷

╭──❏ *SECURITY* ❏
│ • antilink <on/off>
│ • warn <warn member>
╰──────────────────⊷

╭──❏ *AI MENU* ❏
│ • ai / groq / gpt <ask AI>
│ • imagine / dalle <generate image>
╰──────────────────⊷

╭──❏ *DOWNLOADER & MEDIA* ❏
│ • play <audio download>
│ • video / ytmp4 <video download>
│ • tiktok / tt <TikTok download>
│ • sticker / s <convert to sticker>
│ • toimg <sticker to image>
│ • vv2 / vv <view once cracker>
╰──────────────────⊷

╭──❏ *UTILITY & TOOLS* ❏
│ • ss / ssweb <website screenshot>
│ • tourl <upload media to link>
│ • 8ball <magic 8ball>
│ • compliment <send compliment>
│ • ping <check speed>
╰──────────────────⊷
`;
}

const commands = [
    // MENU & SYSTEM
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

    // VIEWONCE CRACKER
    {
        name: 'vv2',
        aliases: ['vv'],
        exec: async ({ sock, from, msg, downloadMediaMessage }) => {
            try {
                const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (!quotedMsg) return sock.sendMessage(from, { text: '❌ Reply to a ViewOnce message!' });

                let targetMedia = quotedMsg.viewOnceMessageV2?.message || 
                                  quotedMsg.viewOnceMessageV2Extension?.message || 
                                  quotedMsg.viewOnceMessage?.message || 
                                  quotedMsg;

                const type = Object.keys(targetMedia)[0];
                const buffer = await downloadMediaMessage({ message: targetMedia }, 'buffer', {});

                if (type.includes('image')) {
                    return sock.sendMessage(from, { image: buffer, caption: '🔓 ViewOnce Unlocked' });
                } else if (type.includes('video')) {
                    return sock.sendMessage(from, { video: buffer, caption: '🔓 ViewOnce Unlocked' });
                } else if (type.includes('audio')) {
                    return sock.sendMessage(from, { audio: buffer, mimetype: 'audio/mp4' });
                } else {
                    return sock.sendMessage(from, { text: '❌ Could not extract media.' });
                }
            } catch (err) {
                console.error('VV error:', err.message);
                return sock.sendMessage(from, { text: '❌ Failed to process ViewOnce file.' });
            }
        }
    },

    // AI COMMANDS
    {
        name: 'ai',
        aliases: ['groq', 'gpt', 'bot'],
        exec: async ({ sock, from, args }) => {
            const prompt = args.join(' ');
            if (!prompt) return sock.sendMessage(from, { text: '❌ Provide a prompt!' });

            try {
                if (!process.env.GROQ_API_KEY) {
                    return sock.sendMessage(from, { text: '⚠️ GROQ_API_KEY missing in environment variables.' });
                }

                const chatCompletion = await groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'llama-3.3-70b-versatile',
                });

                const responseText = chatCompletion.choices[0]?.message?.content || 'No response from AI.';
                await sock.sendMessage(from, { text: `🤖 *LANEZ AI*:\n\n${responseText}` });
            } catch (err) {
                console.error('AI Error:', err.message);
                await sock.sendMessage(from, { text: '❌ Failed to generate AI response.' });
            }
        }
    },
    {
        name: 'imagine',
        aliases: ['dalle', 'flux'],
        exec: async ({ sock, from, args }) => {
            const prompt = args.join(' ');
            if (!prompt) return sock.sendMessage(from, { text: '❌ Provide an image description!' });

            await sock.sendMessage(from, { text: '🎨 Generating image...' });
            const imgUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}`;
            return sock.sendMessage(from, { image: { url: imgUrl }, caption: `✨ *Prompt:* ${prompt}` });
        }
    },

    // DOWNLOADER & MEDIA
    {
        name: 'play',
        aliases: ['song', 'music'],
        exec: async ({ sock, from, args }) => {
            const query = args.join(' ');
            if (!query) return sock.sendMessage(from, { text: '❌ Provide a song name!' });

            await sock.sendMessage(from, { text: `🎵 Downloading: *${query}*...` });

            try {
                const res = await axios.get(`https://api.vyt.workers.dev/search?q=${encodeURIComponent(query)}`);
                const video = res.data?.results?.[0];
                if (!video) throw new Error('Not found');

                const dlRes = await axios.get(`https://api.dreaded.site/api/ytdl/video?url=${video.url}`);
                const audioUrl = dlRes.data?.result?.download?.audio || dlRes.data?.result?.url;

                if (!audioUrl) throw new Error('Audio URL failed');

                return sock.sendMessage(from, {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mp4',
                    fileName: `${video.title}.mp3`
                });
            } catch (err) {
                console.error('Play error:', err.message);
                return sock.sendMessage(from, { text: '❌ Failed to download audio stream.' });
            }
        }
    },
    {
        name: 'video',
        aliases: ['ytmp4', 'mp4'],
        exec: async ({ sock, from, args }) => {
            const query = args.join(' ');
            if (!query) return sock.sendMessage(from, { text: '❌ Provide a video search term!' });

            await sock.sendMessage(from, { text: `🎥 Downloading video: *${query}*...` });

            try {
                const res = await axios.get(`https://api.vyt.workers.dev/search?q=${encodeURIComponent(query)}`);
                const video = res.data?.results?.[0];
                if (!video) throw new Error('Not found');

                const dlRes = await axios.get(`https://api.dreaded.site/api/ytdl/video?url=${video.url}`);
                const videoUrl = dlRes.data?.result?.download?.video || dlRes.data?.result?.url;

                if (!videoUrl) throw new Error('Video URL failed');

                return sock.sendMessage(from, { video: { url: videoUrl }, caption: `🎬 *${video.title}*` });
            } catch (err) {
                console.error('Video error:', err.message);
                return sock.sendMessage(from, { text: '❌ Failed to download video stream.' });
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
                return sock.sendMessage(from, { text: '❌ TikTok extraction failed.' });
            } catch (err) {
                return sock.sendMessage(from, { text: '❌ Failed to process TikTok link.' });
            }
        }
    },
    {
        name: 'sticker',
        aliases: ['s'],
        exec: async ({ sock, from, msg, downloadMediaMessage }) => {
            const targetMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
            if (!targetMsg?.imageMessage && !targetMsg?.videoMessage) {
                return sock.sendMessage(from, { text: '❌ Reply to an image/video with .sticker' });
            }
            const buffer = await downloadMediaMessage({ message: targetMsg }, 'buffer', {});
            return sock.sendMessage(from, { sticker: buffer });
        }
    },
    {
        name: 'toimg',
        exec: async ({ sock, from, msg, downloadMediaMessage }) => {
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted?.stickerMessage) return sock.sendMessage(from, { text: '❌ Reply to a sticker!' });

            const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {});
            return sock.sendMessage(from, { image: buffer, caption: '🖼️ Converted from Sticker' });
        }
    },

    // UTILITIES
    {
        name: 'ss',
        aliases: ['ssweb'],
        exec: async ({ sock, from, args }) => {
            let url = args[0];
            if (!url) return sock.sendMessage(from, { text: '❌ Provide a URL!' });
            if (!url.startsWith('http')) url = 'https://' + url;

            const ssUrl = `https://image.thum.io/get/width/1200/crop/800/${url}`;
            return sock.sendMessage(from, { image: { url: ssUrl }, caption: `🌐 Screenshot: ${url}` });
        }
    },
    {
        name: 'tourl',
        exec: async ({ sock, from, msg, downloadMediaMessage }) => {
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || msg.message;
            if (!quoted?.imageMessage && !quoted?.videoMessage) {
                return sock.sendMessage(from, { text: '❌ Reply to an image or video!' });
            }

            const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {});
            const form = new FormData();
            form.append('file', buffer, { filename: 'media.jpg' });

            try {
                const res = await axios.post('https://telegra.ph/upload', form, { headers: form.getHeaders() });
                const imgUrl = 'https://telegra.ph' + res.data[0].src;
                return sock.sendMessage(from, { text: `🔗 *Media Link:* ${imgUrl}` });
            } catch (e) {
                return sock.sendMessage(from, { text: '❌ Upload failed.' });
            }
        }
    },
    {
        name: '8ball',
        exec: async ({ sock, from, args }) => {
            if (!args.length) return sock.sendMessage(from, { text: '❌ Ask a question!' });
            const answers = ['Yes', 'No', 'Definitely', 'Ask again later', 'Outlook not good', 'Most likely'];
            const ans = answers[Math.floor(Math.random() * answers.length)];
            return sock.sendMessage(from, { text: `🎱 *8Ball:* ${ans}` });
        }
    },
    {
        name: 'compliment',
        exec: async ({ sock, from }) => {
            return sock.sendMessage(from, { text: '✨ You are doing fantastic work today!' });
        }
    },

    // GROUP & MODERATION
    {
        name: 'antilink',
        exec: async ({ sock, from, args, isGroup }) => {
            if (!isGroup) return sock.sendMessage(from, { text: '❌ Group command only.' });
            const status = args[0]?.toLowerCase();
            if (status === 'on') {
                config.antilink[from] = true;
                return sock.sendMessage(from, { text: '🛡️ Antilink enabled.' });
            } else if (status === 'off') {
                config.antilink[from] = false;
                return sock.sendMessage(from, { text: '🛡️ Antilink disabled.' });
            }
            return sock.sendMessage(from, { text: ' Usage: `.antilink on` or `.antilink off`' });
        }
    },
    {
        name: 'warn',
        exec: async ({ sock, from, msg, isGroup }) => {
            if (!isGroup) return sock.sendMessage(from, { text: '❌ Group command only.' });
            const user = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                         msg.message?.extendedTextMessage?.contextInfo?.participant;
            if (!user) return sock.sendMessage(from, { text: '❌ Mention or reply to a user.' });

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
            if (!user) return sock.sendMessage(from, { text: '❌ Mention or reply to a user.' });

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
            return sock.sendMessage(from, { text: '👑 Promoted to Admin.' });
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
            return sock.sendMessage(from, { text: '📉 Demoted from Admin.' });
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
                    
