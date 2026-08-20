const yts = require('yt-search');
const ytdl = require('ytdl-core');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const CONFIG = {
    OWNER_NUMBER: '233597789459@s.whatsapp.net'
};

const COMMANDS = [
    // --- 1. GENERAL & SYSTEM ---
    {
        name: 'ping',
        cat: 'SYSTEM',
        desc: 'Check bot latency',
        exec: async ({ sock, from }) => {
            await sock.sendMessage(from, { text: '🏓 LANEZ OS: Operational & Active' });
        }
    },
    {
        name: 'runtime',
        cat: 'SYSTEM',
        desc: 'Server uptime status',
        exec: async ({ sock, from }) => {
            const uptime = Math.floor(process.uptime());
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = uptime % 60;
            await sock.sendMessage(from, { text: `⏱️ *Uptime:* ${hours}h ${minutes}m ${seconds}s` });
        }
    },

    // --- 2. MEDIA & DOWNLOADS ---
    {
        name: 'play',
        cat: 'MEDIA',
        desc: 'Search and download YouTube Audio',
        exec: async ({ sock, from, args }) => {
            const query = args.join(' ');
            if (!query) return await sock.sendMessage(from, { text: '⚠️ Please provide a song name.' });

            await sock.sendMessage(from, { text: `🔎 Searching for *${query}*...` });
            const search = await yts(query);
            const video = search.videos[0];
            if (!video) return await sock.sendMessage(from, { text: '❌ No results found on YouTube.' });

            await sock.sendMessage(from, { text: `📥 Downloading: *${video.title}*...` });
            
            // Audio Stream Download
            const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            await sock.sendMessage(from, {
                audio: buffer,
                mimetype: 'audio/mp4',
                ptt: false,
                fileName: `${video.title}.mp3`
            }, { quoted: msg });
        }
    },
    {
        name: 'video',
        cat: 'MEDIA',
        desc: 'Search and download YouTube Video',
        exec: async ({ sock, from, args, msg }) => {
            const query = args.join(' ');
            if (!query) return await sock.sendMessage(from, { text: '⚠️ Please provide a video name.' });

            await sock.sendMessage(from, { text: `🔎 Searching video for *${query}*...` });
            const search = await yts(query);
            const video = search.videos[0];
            if (!video) return await sock.sendMessage(from, { text: '❌ No results found.' });

            await sock.sendMessage(from, { text: `📥 Downloading Video: *${video.title}*...` });

            const stream = ytdl(video.url, { filter: 'videoandaudio', quality: 'lowest' });
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            await sock.sendMessage(from, {
                video: buffer,
                mimetype: 'video/mp4',
                caption: `🎥 *${video.title}*\n⏱️ Duration: ${video.timestamp}`
            }, { quoted: msg });
        }
    },
    {
        name: 'vv',
        cat: 'MEDIA',
        desc: 'Retrieve View Once Media',
        exec: async ({ sock, from, msg }) => {
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const viewOnce = quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessage?.message;

            if (!viewOnce) {
                return await sock.sendMessage(from, { text: '⚠️ Please reply to a View Once photo or video.' });
            }

            const type = Object.keys(viewOnce)[0];
            const mediaContent = viewOnce[type];
            const mediaType = type.replace('Message', '');

            const stream = await downloadContentFromMessage(mediaContent, mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            if (type === 'imageMessage') {
                await sock.sendMessage(from, { image: buffer, caption: '🔓 *View Once Unlocked*' }, { quoted: msg });
            } else if (type === 'videoMessage') {
                await sock.sendMessage(from, { video: buffer, caption: '🔓 *View Once Unlocked*' }, { quoted: msg });
            }
        }
    },

    // --- 3. GROUP ADMINISTRATION ---
    {
        name: 'kick',
        cat: 'GROUP',
        group: true,
        desc: 'Remove user from group',
        exec: async ({ sock, from, mentioned }) => {
            if (!mentioned[0]) return await sock.sendMessage(from, { text: '⚠️ Mention a user to kick.' });
            await sock.groupParticipantsUpdate(from, [mentioned[0]], 'remove');
            await sock.sendMessage(from, { text: '✅ User removed.' });
        }
    },
    {
        name: 'hidetag',
        cat: 'GROUP',
        group: true,
        desc: 'Tag all group members',
        exec: async ({ sock, from, args, participants }) => {
            const text = args.join(' ') || 'Attention Everyone!';
            const mentions = participants.map(p => p.id);
            await sock.sendMessage(from, { text, mentions });
        }
    },

    // --- 4. OWNER PREMIUM COMMANDS ---
    {
        name: 'restart',
        cat: 'OWNER',
        ownerOnly: true,
        desc: 'Reboot bot server',
        exec: async ({ sock, from, sender }) => {
            if (!sender.includes('233597789459')) return await sock.sendMessage(from, { text: '❌ Owner Only Command!' });
            await sock.sendMessage(from, { text: '♻️ Restarting LANEZ Engine...' });
            process.exit(1);
        }
    },
    {
        name: 'broadcast',
        cat: 'OWNER',
        ownerOnly: true,
        desc: 'Send message to all chats',
        exec: async ({ sock, from, args, sender }) => {
            if (!sender.includes('233597789459')) return await sock.sendMessage(from, { text: '❌ Owner Only Command!' });
            const message = args.join(' ');
            if (!message) return await sock.sendMessage(from, { text: '⚠️ Enter broadcast message.' });

            await sock.sendMessage(from, { text: `📢 *OWNER ANNOUNCEMENT*\n\n${message}` });
        }
    },
    {
        name: 'mode',
        cat: 'OWNER',
        ownerOnly: true,
        desc: 'Switch bot access mode',
        exec: async ({ sock, from, args, sender }) => {
            if (!sender.includes('233597789459')) return await sock.sendMessage(from, { text: '❌ Owner Only Command!' });
            const mode = args[0]?.toLowerCase();
            if (mode === 'private') {
                await sock.sendMessage(from, { text: '🔒 LANEZ OS switched to PRIVATE mode.' });
            } else {
                await sock.sendMessage(from, { text: '🌐 LANEZ OS switched to PUBLIC mode.' });
            }
        }
    }
];

module.exports = COMMANDS;
                                                                
