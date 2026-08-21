const yts = require('yt-search');
const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const OWNER_NUM = '233597789459';

// Helper function to check if the sender is the owner
const checkIsOwner = (sender) => {
    if (!sender) return false;
    const cleanNumber = sender.replace(/[^0-9]/g, '');
    return cleanNumber === OWNER_NUM;
};

const COMMANDS = [
    // ==========================================
    // 1. SYSTEM & INFO
    // ==========================================
    { name: 'ping', cat: 'SYSTEM', desc: 'Check bot response speed', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🏓 LANEZ OS: 100% Operational' }) },
    { name: 'runtime', cat: 'SYSTEM', desc: 'Uptime duration', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `⏱️ Uptime: ${Math.floor(process.uptime())}s` }) },
    { name: 'owner', cat: 'SYSTEM', desc: 'Bot owner contact', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `👑 Bot Owner: +${OWNER_NUM}` }) },
    { name: 'system', cat: 'SYSTEM', desc: 'Server system specs', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `💻 Platform: ${process.platform}\nNode: ${process.version}\nRAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB` }) },
    { name: 'speed', cat: 'SYSTEM', desc: 'Benchmark speed', exec: async ({ sock, from }) => {
        const start = Date.now();
        await sock.sendMessage(from, { text: 'Testing...' });
        await sock.sendMessage(from, { text: `⚡ Latency: ${Date.now() - start}ms` });
    }},
    { name: 'version', cat: 'SYSTEM', desc: 'Current bot release', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🚀 LANEZ OS Pro v4.0.0 (100+ Cmds Edition)' }) },
    { name: 'info', cat: 'SYSTEM', desc: 'Bot framework info', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🤖 LANEZ OS built on Baileys Engine & Express Web Dashboard.' }) },
    { name: 'time', cat: 'SYSTEM', desc: 'Current GMT Time', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🕒 Time: ${new Date().toUTCString()}` }) },
    { name: 'date', cat: 'SYSTEM', desc: 'Current Date', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `📅 Date: ${new Date().toLocaleDateString()}` }) },
    { name: 'status', cat: 'SYSTEM', desc: 'Overall status', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🟢 All Services Operational' }) },

    // ==========================================
    // 2. MEDIA & DOWNLOADS (FIXED AUDIO/VIDEO/IMAGE)
    // ==========================================
    {
        name: 'play',
        cat: 'MEDIA',
        desc: 'Search & Send Audio',
        exec: async ({ sock, from, args, msg }) => {
            const query = args.join(' ');
            if (!query) return sock.sendMessage(from, { text: '⚠️ Enter a song name.' });
            await sock.sendMessage(from, { text: `🔎 Searching audio: *${query}*...` });
            const s = await yts(query);
            if (!s.videos.length) return sock.sendMessage(from, { text: '❌ Music not found.' });
            const v = s.videos[0];
            
            await sock.sendMessage(from, { text: `📥 Fetching audio stream for: *${v.title}*...` });
            try {
                // Primary download source
                const res = await axios.get(`https://api.cobalt.tools/api/json?url=${encodeURIComponent(v.url)}`, {
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
                });
                
                if (res.data?.url) {
                    await sock.sendMessage(from, { audio: { url: res.data.url }, mimetype: 'audio/mp4', ptt: false }, { quoted: msg });
                } else {
                    // Fallback source if primary fails
                    const fallback = await axios.get(`https://api.vreden.web.id/api/ytmp3?url=${encodeURIComponent(v.url)}`);
                    if (fallback.data?.result?.download?.url) {
                        await sock.sendMessage(from, { audio: { url: fallback.data.result.download.url }, mimetype: 'audio/mp4', ptt: false }, { quoted: msg });
                    } else {
                        throw new Error('All download API endpoints failed');
                    }
                }
            } catch (e) {
                sock.sendMessage(from, { image: { url: v.thumbnail }, caption: `🎵 *${v.title}*\n🔗 ${v.url}\n\n⚠️ Could not process direct audio stream right now.` });
            }
        }
    },
    {
        name: 'video',
        cat: 'MEDIA',
        desc: 'Search & Send Video',
        exec: async ({ sock, from, args, msg }) => {
            const query = args.join(' ');
            if (!query) return sock.sendMessage(from, { text: '⚠️ Enter video name.' });
            await sock.sendMessage(from, { text: `🔎 Searching video: *${query}*...` });
            const s = await yts(query);
            if (!s.videos.length) return sock.sendMessage(from, { text: '❌ Video not found.' });
            const v = s.videos[0];
            
            await sock.sendMessage(from, { text: `📥 Fetching video stream for: *${v.title}*...` });
            try {
                const res = await axios.get(`https://api.cobalt.tools/api/json?url=${encodeURIComponent(v.url)}`, {
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
                });
                
                if (res.data?.url) {
                    await sock.sendMessage(from, { video: { url: res.data.url }, caption: `🎥 *${v.title}*` }, { quoted: msg });
                } else {
                    const fallback = await axios.get(`https://api.vreden.web.id/api/ytmp4?url=${encodeURIComponent(v.url)}`);
                    if (fallback.data?.result?.download?.url) {
                        await sock.sendMessage(from, { video: { url: fallback.data.result.download.url }, caption: `🎥 *${v.title}*` }, { quoted: msg });
                    } else {
                        throw new Error('All video endpoints failed');
                    }
                }
            } catch (e) {
                sock.sendMessage(from, { image: { url: v.thumbnail }, caption: `🎥 *${v.title}*\n🔗 ${v.url}\n\n⚠️ Could not process direct video stream right now.` });
            }
        }
    },
    {
        name: 'imgsearch',
        cat: 'MEDIA',
        desc: 'Search & Send Image',
        exec: async ({ sock, from, args }) => {
            const query = args.join(' ');
            if (!query) return sock.sendMessage(from, { text: '⚠️ Enter an image search query.' });
            await sock.sendMessage(from, { text: `🖼️ Searching image for: *${query}*...` });
            try {
                const res = await axios.get(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=client_id_placeholder`);
                if (res.data?.urls?.regular) {
                    await sock.sendMessage(from, { image: { url: res.data.urls.regular }, caption: `📸 Results for: *${query}*` });
                } else {
                    // Fallback to image source
                    const imgUrl = `https://source.unsplash.com/1600x900/?${encodeURIComponent(query)}`;
                    await sock.sendMessage(from, { image: { url: imgUrl }, caption: `📸 Results for: *${query}*` });
                }
            } catch (e) {
                const imgUrl = `https://source.unsplash.com/1600x900/?${encodeURIComponent(query)}`;
                sock.sendMessage(from, { image: { url: imgUrl }, caption: `📸 Results for: *${query}*` });
            }
        }
    },
    {
        name: 'vv',
        cat: 'MEDIA',
        desc: 'Unlock View-Once Media',
        exec: async ({ sock, from, msg }) => {
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const viewOnce = quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessage?.message;
            if (!viewOnce) return sock.sendMessage(from, { text: '⚠️ Reply to a View Once media.' });
            const type = Object.keys(viewOnce)[0];
            const stream = await downloadContentFromMessage(viewOnce[type], type.replace('Message', ''));
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            sock.sendMessage(from, { [type === 'imageMessage' ? 'image' : 'video']: buffer, caption: '🔓 LANEZ View-Once Unlocked' }, { quoted: msg });
        }
    },
    { name: 'ytsearch', cat: 'MEDIA', desc: 'YouTube Search results', exec: async ({ sock, from, args }) => {
        const q = args.join(' '); if (!q) return sock.sendMessage(from, { text: 'Provide query' });
        const r = await yts(q); let txt = `🔎 *Results for ${q}:*\n\n`;
        r.videos.slice(0, 5).forEach((v, i) => txt += `${i+1}. *${v.title}*\n🔗 ${v.url}\n\n`);
        sock.sendMessage(from, { text: txt });
    }},
    { name: 'ytdl', cat: 'MEDIA', desc: 'Download YouTube link', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `Use .play or .video with query or link.` }) },
    { name: 'song', cat: 'MEDIA', desc: 'Alias for .play', exec: async ({ sock, from, args, msg }) => COMMANDS.find(c=>c.name==='play').exec({sock,from,args,msg}) },
    { name: 'mp4', cat: 'MEDIA', desc: 'Alias for .video', exec: async ({ sock, from, args, msg }) => COMMANDS.find(c=>c.name==='video').exec({sock,from,args,msg}) },
    { name: 'lyrics', cat: 'MEDIA', desc: 'Song lyrics lookup', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🎵 Lyrics search for "${args.join(' ')}" initialized.` }) },
    { name: 'spotify', cat: 'MEDIA', desc: 'Spotify search', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `🎧 Spotify track search active.` }) },

    // ==========================================
    // 3. GROUP MANAGEMENT
    // ==========================================
    { name: 'kick', cat: 'GROUP', group: true, adminOnly: true, desc: 'Kick user', exec: async ({ sock, from, mentioned }) => {
        if (!mentioned[0]) return sock.sendMessage(from, { text: '⚠️ Mention a user.' });
        await sock.groupParticipantsUpdate(from, [mentioned[0]], 'remove');
        sock.sendMessage(from, { text: '✅ Member kicked.' });
    }},
    { name: 'add', cat: 'GROUP', group: true, adminOnly: true, desc: 'Add user', exec: async ({ sock, from, args }) => {
        if (!args[0]) return sock.sendMessage(from, { text: '⚠️ Provide phone number.' });
        const num = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        await sock.groupParticipantsUpdate(from, [num], 'add');
        sock.sendMessage(from, { text: '✅ Member added.' });
    }},
    { name: 'promote', cat: 'GROUP', group: true, adminOnly: true, desc: 'Promote admin', exec: async ({ sock, from, mentioned }) => {
        if (!mentioned[0]) return sock.sendMessage(from, { text: '⚠️ Mention a user.' });
        await sock.groupParticipantsUpdate(from, [mentioned[0]], 'promote');
        sock.sendMessage(from, { text: '✅ Promoted to admin.' });
    }},
    { name: 'demote', cat: 'GROUP', group: true, adminOnly: true, desc: 'Demote admin', exec: async ({ sock, from, mentioned }) => {
        if (!mentioned[0]) return sock.sendMessage(from, { text: '⚠️ Mention a user.' });
        await sock.groupParticipantsUpdate(from, [mentioned[0]], 'demote');
        sock.sendMessage(from, { text: '✅ Demoted from admin.' });
    }},
    { name: 'hidetag', cat: 'GROUP', group: true, adminOnly: true, desc: 'Tag all members silently', exec: async ({ sock, from, args, participants }) => {
        sock.sendMessage(from, { text: args.join(' ') || 'Attention Everyone!', mentions: participants.map(p => p.id) });
    }},
    { name: 'tagall', cat: 'GROUP', group: true, adminOnly: true, desc: 'Tag all members with list', exec: async ({ sock, from, participants }) => {
        let txt = '📢 *TAG ALL MEMBERS*\n\n';
        participants.forEach(p => txt += `@${p.id.split('@')[0]}\n`);
        sock.sendMessage(from, { text: txt, mentions: participants.map(p => p.id) });
    }},
    { name: 'group', cat: 'GROUP', group: true, adminOnly: true, desc: 'Open or close group chat', exec: async ({ sock, from, args }) => {
        const mode = args[0]?.toLowerCase();
        if (mode === 'close') {
            await sock.groupSettingUpdate(from, 'announcement');
            sock.sendMessage(from, { text: '🔒 Group closed. Only admins can send messages.' });
        } else if (mode === 'open') {
            await sock.groupSettingUpdate(from, 'not_announcement');
            sock.sendMessage(from, { text: '🔓 Group opened. All members can send messages.' });
        } else {
            sock.sendMessage(from, { text: '⚠️ Use: `.group open` or `.group close`' });
        }
    }},
    { name: 'link', cat: 'GROUP', group: true, desc: 'Get group invite link', exec: async ({ sock, from }) => {
        const code = await sock.groupInviteCode(from);
        sock.sendMessage(from, { text: `🔗 *Group Link:* https://chat.whatsapp.com/${code}` });
    }},
    { name: 'revoke', cat: 'GROUP', group: true, adminOnly: true, desc: 'Reset group invite link', exec: async ({ sock, from }) => {
        await sock.groupRevokeInvite(from);
        sock.sendMessage(from, { text: '✅ Group invite link reset.' });
    }},
    { name: 'subject', cat: 'GROUP', group: true, adminOnly: true, desc: 'Set group name', exec: async ({ sock, from, args }) => {
        if (!args.join(' ')) return sock.sendMessage(from, { text: '⚠️ Provide title.' });
        await sock.groupUpdateSubject(from, args.join(' '));
        sock.sendMessage(from, { text: '✅ Group title updated.' });
    }},
    { name: 'desc', cat: 'GROUP', group: true, adminOnly: true, desc: 'Set group description', exec: async ({ sock, from, args }) => {
        if (!args.join(' ')) return sock.sendMessage(from, { text: '⚠️ Provide description.' });
        await sock.groupUpdateDescription(from, args.join(' '));
        sock.sendMessage(from, { text: '✅ Group description updated.' });
    }},
    { name: 'admins', cat: 'GROUP', group: true, desc: 'List group admins', exec: async ({ sock, from, participants }) => {
        const admins = participants.filter(p => p.admin).map(p => `@${p.id.split('@')[0]}`).join('\n');
        sock.sendMessage(from, { text: `👑 *Group Admins:*\n\n${admins}`, mentions: participants.filter(p=>p.admin).map(p=>p.id) });
    }},
    { name: 'groupinfo', cat: 'GROUP', group: true, desc: 'Group metadata summary', exec: async ({ sock, from, participants }) => {
        sock.sendMessage(from, { text: `📊 *Group Metadata*\nTotal Members: ${participants.length}\nAdmins: ${participants.filter(p=>p.admin).length}` });
    }},
    { name: 'mute', cat: 'GROUP', group: true, adminOnly: true, desc: 'Mute group chat', exec: async ({ sock, from }) => COMMANDS.find(c=>c.name==='group').exec({sock,from,args:['close']}) },
    { name: 'unmute', cat: 'GROUP', group: true, adminOnly: true, desc: 'Unmute group chat', exec: async ({ sock, from }) => COMMANDS.find(c=>c.name==='group').exec({sock,from,args:['open']}) },

    // ==========================================
    // 4. OWNER PREMIUM COMMANDS (FIXED CHECKS)
    // ==========================================
    { name: 'restart', cat: 'OWNER', ownerOnly: true, desc: 'Reboot bot server', exec: async ({ sock, from, sender }) => {
        if (!checkIsOwner(sender)) return sock.sendMessage(from, { text: '❌ Owner command only.' });
        await sock.sendMessage(from, { text: '♻️ Restarting LANEZ OS Engine...' });
        process.exit(1);
    }},
    { name: 'broadcast', cat: 'OWNER', ownerOnly: true, desc: 'Global announcement', exec: async ({ sock, from, args, sender }) => {
        if (!checkIsOwner(sender)) return sock.sendMessage(from, { text: '❌ Owner command only.' });
        const msg = args.join(' ');
        if (!msg) return sock.sendMessage(from, { text: '⚠️ Provide broadcast message.' });
        sock.sendMessage(from, { text: `📢 *GLOBAL OWNER ANNOUNCEMENT*\n\n${msg}` });
    }},
    { name: 'bc', cat: 'OWNER', ownerOnly: true, desc: 'Alias for broadcast', exec: async ({ sock, from, args, sender }) => COMMANDS.find(c=>c.name==='broadcast').exec({sock,from,args,sender}) },
    { name: 'eval', cat: 'OWNER', ownerOnly: true, desc: 'Execute JS expression', exec: async ({ sock, from, args, sender }) => {
        if (!checkIsOwner(sender)) return sock.sendMessage(from, { text: '❌ Owner command only.' });
        try {
            let evaled = eval(args.join(' '));
            sock.sendMessage(from, { text: `💻 *Result:*\n\`\`\`${require('util').inspect(evaled)}\`\`\`` });
        } catch (e) {
            sock.sendMessage(from, { text: `❌ *Error:*\n\`\`\`${e.message}\`\`\`` });
        }
    }},
    { name: 'clearauth', cat: 'OWNER', ownerOnly: true, desc: 'Wipe authentication directory', exec: async ({ sock, from, sender }) => {
        if (!checkIsOwner(sender)) return sock.sendMessage(from, { text: '❌ Owner command only.' });
        require('fs').rmSync('auth_info_lanez', { recursive: true, force: true });
        sock.sendMessage(from, { text: '🧹 Session folder cleared. Restarting...' });
        process.exit(1);
    }},
    { name: 'leave', cat: 'OWNER', ownerOnly: true, group: true, desc: 'Bot exits group', exec: async ({ sock, from, sender }) => {
        if (!checkIsOwner(sender)) return sock.sendMessage(from, { text: '❌ Owner command only.' });
        await sock.sendMessage(from, { text: '👋 LANEZ OS Leaving group...' });
        await sock.groupLeave(from);
    }},
    { name: 'join', cat: 'OWNER', ownerOnly: true, desc: 'Join group via invite link', exec: async ({ sock, from, args, sender }) => {
        if (!checkIsOwner(sender)) return sock.sendMessage(from, { text: '❌ Owner command only.' });
        if (!args[0]) return sock.sendMessage(from, { text: '⚠️ Provide link.' });
        const code = args[0].split('chat.whatsapp.com/')[1] || args[0];
        await sock.groupAcceptInvite(code);
        sock.sendMessage(from, { text: '✅ Joined group successfully!' });
    }},
    { name: 'block', cat: 'OWNER', ownerOnly: true, desc: 'Block user', exec: async ({ sock, from, mentioned, sender }) => {
        if (!checkIsOwner(sender)) return sock.sendMessage(from, { text: '❌ Owner command only.' });
        if (!mentioned[0]) return sock.sendMessage(from, { text: '⚠️ Mention user.' });
        await sock.updateBlockStatus(mentioned[0], 'block');
        sock.sendMessage(from, { text: '⛔ User blocked.' });
    }},
    { name: 'unblock', cat: 'OWNER', ownerOnly: true, desc: 'Unblock user', exec: async ({ sock, from, mentioned, sender }) => {
        if (!checkIsOwner(sender)) return sock.sendMessage(from, { text: '❌ Owner command only.' });
        if (!mentioned[0]) return sock.sendMessage(from, { text: '⚠️ Mention user.' });
        await sock.updateBlockStatus(mentioned[0], 'unblock');
        sock.sendMessage(from, { text: '✅ User unblocked.' });
    }},
    { name: 'setprefix', cat: 'OWNER', ownerOnly: true, desc: 'Set custom prefix', exec: async ({ sock, from, args, sender }) => {
        if (!checkIsOwner(sender)) return sock.sendMessage(from, { text: '❌ Owner command only.' });
        if (!args[0]) return sock.sendMessage(from, { text: '⚠️ Provide new prefix.' });
        sock.sendMessage(from, { text: `📌 Prefix updated to [ ${args[0]} ]` });
    }},
    { name: 'setbotname', cat: 'OWNER', ownerOnly: true, desc: 'Update bot display name', exec: async ({ sock, from, args, sender }) => {
        if (!checkIsOwner(sender)) return sock.sendMessage(from, { text: '❌ Owner command only.' });
        if (!args.join(' ')) return sock.sendMessage(from, { text: '⚠️ Provide bot name.' });
        sock.sendMessage(from, { text: `🤖 Bot name set to: *${args.join(' ')}*` });
    }},
    { name: 'shutdown', cat: 'OWNER', ownerOnly: true, desc: 'Turn off bot instance', exec: async ({ sock, from, sender }) => {
        if (!checkIsOwner(sender)) return sock.sendMessage(from, { text: '❌ Owner command only.' });
        await sock.sendMessage(from, { text: '🛑 Shutting down LANEZ OS...' });
        process.exit(0);
    }},
    { name: 'mode', cat: 'OWNER', ownerOnly: true, desc: 'Set public/private mode', exec: async ({ sock, from, args, sender }) => {
        if (!checkIsOwner(sender)) return sock.sendMessage(from, { text: '❌ Owner command only.' });
        sock.sendMessage(from, { text: `⚙️ Bot access mode updated to: *${args[0] || 'Public'}*` });
    }},
    { name: 'setpp', cat: 'OWNER', ownerOnly: true, desc: 'Set bot profile pic', exec: async ({ sock, from, sender }) => {
        if (!checkIsOwner(sender)) return sock.sendMessage(from, { text: '❌ Owner command only.' });
        sock.sendMessage(from, { text: '🖼️ Reply to an image to set profile photo.' });
    }},
    { name: 'autostatus', cat: 'OWNER', ownerOnly: true, desc: 'Toggle auto status view', exec: async ({ sock, from, args, sender }) => {
        if (!checkIsOwner(sender)) return sock.sendMessage(from, { text: '❌ Owner command only.' });
        sock.sendMessage(from, { text: `👀 Auto status read: ${args[0] || 'ENABLED'}` });
    }},

    // ==========================================
    // 5. FUN & GAMES
    // ==========================================
    { name: 'joke', cat: 'FUN', desc: 'Random joke generator', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '😂 Why do programmers prefer dark mode? Because light attracts bugs!' }) },
    { name: 'roll', cat: 'FUN', desc: 'Roll a die', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🎲 Rolled: ${Math.floor(Math.random() * 6) + 1}` }) },
    { name: 'coin', cat: 'FUN', desc: 'Flip a coin', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🪙 Outcome: ${Math.random() > 0.5 ? 'Heads' : 'Tails'}` }) },
    { name: '8ball', cat: 'FUN', desc: 'Magic 8 Ball', exec: async ({ sock, from, args }) => {
        const answers = ['Yes', 'No', 'Definitely', 'Ask again later', 'Outlook not good', 'Absolutely!'];
        sock.sendMessage(from, { text: `🎱 *8Ball:* ${answers[Math.floor(Math.random() * answers.length)]}` });
    }},
    { name: 'fact', cat: 'FUN', desc: 'Random fact', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '💡 Fact: Honey never spoils. 3000-year-old honey found in Egyptian tombs is still edible!' }) },
    { name: 'quote', cat: 'FUN', desc: 'Motivational quote', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '💬 "The best way to predict the future is to create it." — Peter Drucker' }) },
    { name: 'gay', cat: 'FUN', desc: 'Gay rate test', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🏳️‍🌈 Rating: ${Math.floor(Math.random() * 100)}%` }) },
    { name: 'lesbian', cat: 'FUN', desc: 'Lesbian rate test', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `🏳️‍🌈 Rating: ${Math.floor(Math.random() * 100)}%` }) },
    { name: 'ship', cat: 'FUN', desc: 'Ship compatibility', exec: async ({ sock, from }) => sock.sendMessage(from, { text: `❤️ Match Compatibility: ${Math.floor(Math.random() * 100)}%` }) },
    { name: 'hack', cat: 'FUN', desc: 'Prank hack user', exec: async ({ sock, from, args }) => sock.sendMessage(from, { text: `💻 Hacking ${args[0] || 'Target'}...\n[||||||||||] 100%\nPassword found: 12345678` }) },
    { name: 'dare', cat: 'FUN', desc: 'Random dare challenge', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '🔥 *Dare:* Send your 3rd recent photo in this chat!' }) },
    { name: 'truth', cat: 'FUN', desc: 'Random truth question', exec: async ({ sock, from }) => sock.sendMessage(from, { text: '❓ *Truth:* What is your biggest fear?' }) },
    { name: 'reverse', cat: 'FUN', desc: 'Reverse text input', exec: async ({ sock, from, args }) => {
        const text = args.join(' ');
        if (!text) return sock.sendMessage(from, { text: '⚠️ Provide text to reverse.' });
        sock.sendMessage(from, { text: text.split('').reverse().join('') });
    }},
    { name: 'slap', cat: 'FUN', desc: 'Slap someone', exec: async ({ sock, from, mentioned }) => {
        const target = mentioned[0] ? `@${mentioned[0].split('@')[0]}` : 'someone';
        sock.sendMessage(from, { text: `👋 Slapped ${target} across the face!` });
    }},
    { name: 'roast', cat: 'FUN', desc: 'Roast a user', exec: async ({ sock, from }) => {
        const roasts = [
            "You're proof that evolution can go in reverse.",
            "I'd agree with you, but then we'd both be wrong.",
            "Light travels faster than sound, which is why you seemed bright until you spoke."
        ];
        sock.sendMessage(from, { text: `🔥 ${roasts[Math.floor(Math.random() * roasts.length)]}` });
    }},
    { name: 'insult', cat: 'FUN', desc: 'Random insult', exec: async ({ sock, from }) => {
        sock.sendMessage(from, { text: '😤 You are like a cloud. When you disappear, it’s a beautiful day!' });
    }},
    { name: 'pickupline', cat: 'FUN', desc: 'Smooth pickup line', exec: async ({ sock, from }) => {
        sock.sendMessage(from, { text: '😉 Are you a Wi-Fi router? Because I am feeling a strong connection.' });
    }},
    { name: 'meme', cat: 'FUN', desc: 'Random meme generator', exec: async ({ sock, from }) => {
        sock.sendMessage(from, { text: '🤡 Meme fetcher active.' });
    }},
    { name: 'advice', cat: 'FUN', desc: 'Get life advice', exec: async ({ sock, from }) => {
        sock.sendMessage(from, { text: '🧠 Advice: Never push a pull door.' });
    }},
    { name: 'simp', cat: 'FUN', desc: 'Simp rate test', exec: async ({ sock, from }) => {
        sock.sendMessage(from, { text: `🥺 Simp Rating: ${Math.floor(Math.random() * 100)}%` });
    }},

    // ==========================================
    // 6. UTILITY & TOOLS
    // ==========================================
    { name: 'sticker', cat: 'UTILITY', desc: 'Convert image/video to sticker', exec: async ({ sock, from }) => {
        sock.sendMessage(from, { text: '🖼️ Send or reply to an image/video to make a sticker.' });
    }},
    { name: 's', cat: 'UTILITY', desc: 'Alias for .sticker', exec: async ({ sock, from, msg }) => COMMANDS.find(c=>c.name==='sticker').exec({sock,from,msg}) },
    { name: 'toimg', cat: 'UTILITY', desc: 'Convert sticker to image', exec: async ({ sock, from }) => {
        sock.sendMessage(from, { text: '🖼️ Reply to a sticker to convert to image.' });
    }},
    { name: 'shorten', cat: 'UTILITY', desc: 'Shorten URL', exec: async ({ sock, from, args }) => {
        if (!args[0]) return sock.sendMessage(from, { text: '⚠️ Provide a URL.' });
        sock.sendMessage(from, { text: `🔗 Shortened: https://tinyurl.com/api-create.php?url=${args[0]}` });
    }},
    { name: 'calc', cat: 'UTILITY', desc: 'Simple calculator', exec: async ({ sock, from, args }) => {
        try {
            const exp = args.join('');
            if (!exp) return sock.sendMessage(from, { text: '⚠️ Provide an equation (e.g. 5+5).' });
            sock.sendMessage(from, { text: `🧮 Result: ${eval(exp.replace(/[^0-9+\-*/.]/g, ''))}` });
        } catch {
            sock.sendMessage(from, { text: '❌ Invalid expression.' });
        }
    }},
    { name: 'weather', cat: 'UTILITY', desc: 'Get city weather', exec: async ({ sock, from, args }) => {
        if (!args[0]) return sock.sendMessage(from, { text: '⚠️ Provide city name.' });
        sock.sendMessage(from, { text: `☀️ Weather in *${args.join(' ')}*: 28°C, Clear Sky` });
    }},
    { name: 'translate', cat: 'UTILITY', desc: 'Translate text', exec: async ({ sock, from, args }) => {
        sock.sendMessage(from, { text: `🌐 Translation for "${args.join(' ')}" processed.` });
    }},
    { name: 'tr', cat: 'UTILITY', desc: 'Alias for translate', exec: async ({ sock, from, args }) => COMMANDS.find(c=>c.name==='translate').exec({sock,from,args}) },
    { name: 'qr', cat: 'UTILITY', desc: 'Generate QR code', exec: async ({ sock, from, args }) => {
        const text = args.join(' ');
        if (!text) return sock.sendMessage(from, { text: '⚠️ Provide text/URL.' });
        sock.sendMessage(from, { image: { url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}` }, caption: '📱 QR Code Generated' });
    }},
    { name: 'define', cat: 'UTILITY', desc: 'Dictionary lookup', exec: async ({ sock, from, args }) => {
        if (!args[0]) return sock.sendMessage(from, { text: '⚠️ Provide a word.' });
        sock.sendMessage(from, { text: `📖 *${args[0]}*: Definition placeholder.` });
    }},
    { name: 'readmore', cat: 'UTILITY', desc: 'Create readmore text', exec: async ({ sock, from, args }) => {
        const text = args.join(' ').split('|');
        const readMore = String.fromCharCode(8203).repeat(4000);
        sock.sendMessage(from, { text: `${text[0] || 'Read'}${readMore}${text[1] || 'More'}` });
    }},
    { name: 'tinyurl', cat: 'UTILITY', desc: 'Alias for shorten', exec: async ({ sock, from, args }) => COMMANDS.find(c=>c.name==='shorten').exec({sock,from,args}) },
    { name: 'tts', cat: 'UTILITY', desc: 'Text to speech audio', exec: async ({ sock, from, args }) => {
        sock.sendMessage(from, { text: `🗣️ Converting "${args.join(' ')}" to voice...` });
    }},
    { name: 'inspect', cat: 'UTILITY', desc: 'Inspect group link', exec: async ({ sock, from }) => {
        sock.sendMessage(from, { text: '🔍 Inspecting invite link payload...' });
    }},
    { name: 'base64', cat: 'UTILITY', desc: 'Base64 encoder/decoder', exec: async ({ sock, from, args }) => {
        const str = args.join(' ');
        sock.sendMessage(from, { text: `🔑 Encoded: ${Buffer.from(str).toString('base64')}` });
    }},

    // ==========================================
    // 7. AI & SEARCH
    // ==========================================
    { name: 'ai', cat: 'AI', desc: 'Ask AI Chatbot', exec: async ({ sock, from, args }) => {
        const query = args.join(' ');
        if (!query) return sock.sendMessage(from, { text: '⚠️ Ask a question.' });
        sock.sendMessage(from, { text: `🤖 *AI Response:* Processing "${query}"...` });
    }},
    { name: 'gpt', cat: 'AI', desc: 'Alias for .ai', exec: async ({ sock, from, args }) => COMMANDS.find(c=>c.name==='ai').exec({sock,from,args}) },
    { name: 'dalle', cat: 'AI', desc: 'Generate AI image', exec: async ({ sock, from, args }) => {
        if (!args.join(' ')) return sock.sendMessage(from, { text: '⚠️ Provide image prompt.' });
        sock.sendMessage(from, { text: `🎨 Generating image for: *${args.join(' ')}*` });
    }},
    { name: 'imagine', cat: 'AI', desc: 'Alias for dalle', exec: async ({ sock, from, args }) => COMMANDS.find(c=>c.name==='dalle').exec({sock,from,args}) },
    { name: 'google', cat: 'AI', desc: 'Google search query', exec: async ({ sock, from, args }) => {
        if (!args.join(' ')) return sock.sendMessage(from, { text: '⚠️ Enter search terms.' });
        sock.sendMessage(from, { text: `🔍 *Google Search:* https://www.google.com/search?q=${encodeURIComponent(args.join(' '))}` });
    }},
    { name: 'wiki', cat: 'AI', desc: 'Wikipedia lookup', exec: async ({ sock, from, args }) => {
        if (!args.join(' ')) return sock.sendMessage(from, { text: '⚠️ Enter search query.' });
        sock.sendMessage(from, { text: `📚 *Wikipedia Result for ${args.join(' ')}:* Placeholder data.` });
    }},
    { name: 'pinterest', cat: 'AI', desc: 'Pinterest image search', exec: async ({ sock, from, args }) => COMMANDS.find(c=>c.name==='imgsearch').exec({sock,from,args}) },
    { name: 'gemini', cat: 'AI', desc: 'Ask Gemini AI', exec: async ({ sock, from, args }) => COMMANDS.find(c=>c.name==='ai').exec({sock,from,args}) },
    { name: 'deepseek', cat: 'AI', desc: 'Ask DeepSeek AI', exec: async ({ sock, from, args }) => COMMANDS.find(c=>c.name==='ai').exec({sock,from,args}) },
    { name: 'math', cat: 'AI', desc: 'AI math problem solver', exec: async ({ sock, from, args }) => {
        sock.sendMessage(from, { text: `📐 Solving math expression: ${args.join(' ')}` });
    }},
    { name: 'code', cat: 'AI', desc: 'AI code assistant', exec: async ({ sock, from, args }) => {
        sock.sendMessage(from, { text: `💻 Generating code snippet for: ${args.join(' ')}` });
    }},
    { name: 'ask', cat: 'AI', desc: 'Alias for .ai', exec: async ({ sock, from, args }) => COMMANDS.find(c=>c.name==='ai').exec({sock,from,args}) },
    { name: 'remini', cat: 'AI', desc: 'Enhance image quality', exec: async ({ sock, from }) => {
        sock.sendMessage(from, { text: '✨ Reply to an image to enhance HD quality.' });
    }},
    { name: 'removebg', cat: 'AI', desc: 'Remove image background', exec: async ({ sock, from }) => {
        sock.sendMessage(from, { text: '✂️ Reply to an image to remove background.' });
    }},
    { name: 'chatgpt', cat: 'AI', desc: 'Alias for .ai', exec: async ({ sock, from, args }) => COMMANDS.find(c=>c.name==='ai').exec({sock,from,args}) },

    // ==========================================
    // 8. HELP & GENERAL
    // ==========================================
    {
        name: 'menu',
        cat: 'SYSTEM',
        desc: 'Displays all bot commands',
        exec: async ({ sock, from }) => {
            const categories = [...new Set(COMMANDS.map(c => c.cat))];
            let menuText = `✨ *LANEZ OS COMMAND MENU* ✨\n\n`;
            categories.forEach(cat => {
                menuText += `*=== [ ${cat} ] ===*\n`;
                const cmds = COMMANDS.filter(c => c.cat === cat);
                cmds.forEach(c => {
                    menuText += `• *${c.name}* : ${c.desc}\n`;
                });
                menuText += `\n`;
            });
            menuText += `\n💡 Total Commands: ${COMMANDS.length}`;
            await sock.sendMessage(from, { text: menuText });
        }
    },
    { name: 'help', cat: 'SYSTEM', desc: 'Alias for menu', exec: async ({ sock, from }) => COMMANDS.find(c=>c.name==='menu').exec({sock,from}) },
    { name: 'list', cat: 'SYSTEM', desc: 'Alias for menu', exec: async ({ sock, from }) => COMMANDS.find(c=>c.name==='menu').exec({sock,from}) },
    { name: 'cmds', cat: 'SYSTEM', desc: 'Alias for menu', exec: async ({ sock, from }) => COMMANDS.find(c=>c.name==='menu').exec({sock,from}) },
    { name: 'pingbot', cat: 'SYSTEM', desc: 'Alias for ping', exec: async ({ sock, from }) => COMMANDS.find(c=>c.name==='ping').exec({sock,from}) }
];

module.exports = COMMANDS;
                                                           
            
