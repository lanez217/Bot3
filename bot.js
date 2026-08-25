const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys');

async function startBot(phoneNumber = null, callback = null) {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_lanez');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            keepAliveIntervalMs: 25000,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            syncFullHistory: false
        });

        sock.ev.on('creds.update', saveCreds);

        // Handle pairing code requests from web panel
        if (phoneNumber && !sock.authState.creds.registered) {
            setTimeout(async () => {
                try {
                    const cleanNum = phoneNumber.replace(/[^0-9]/g, '');
                    const code = await sock.requestPairingCode(cleanNum);
                    console.log(`🔑 Generated Pairing Code: ${code}`);
                    if (callback) callback(code);
                } catch (err) {
                    console.error('Pairing error:', err);
                    if (callback) callback(null);
                }
            }, 2000);
        }

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'open') {
                console.log('✅ Connected to WhatsApp! Lanez OS View-Once Active.');
            } else if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                if (statusCode !== DisconnectReason.loggedOut) {
                    setTimeout(() => startBot(), 3000);
                }
            }
        });

        // Listen for .ok command
        sock.ev.on('messages.upsert', async (m) => {
            try {
                const msg = m.messages[0];
                if (!msg || !msg.message) return;

                const from = msg.key.remoteJid;
                const body = (
                    msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    ''
                ).trim().toLowerCase();

                // Check for .ok command
                if (body !== '.ok') return;

                // Extract quoted message context
                const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (!quotedMsg) {
                    const errorText = `
╭───────────────⊷
│ ❌ *LANEZ OS SYSTEM*
├───────────────⊷
│ Reply to a View Once 
│ message with *.ok*
╰───────────────⊷
_*POWERED BY LANEZ*_`;
                    return sock.sendMessage(from, { text: errorText }, { quoted: msg });
                }

                // Locate inner View Once object inside WhatsApp payload
                let targetMedia = quotedMsg.viewOnceMessageV2?.message || 
                                  quotedMsg.viewOnceMessageV2Extension?.message || 
                                  quotedMsg.viewOnceMessage?.message || 
                                  quotedMsg;

                const type = Object.keys(targetMedia)[0];

                if (!type.includes('image') && !type.includes('video') && !type.includes('audio')) {
                    const invalidText = `
╭───────────────⊷
│ ⚠️ *LANEZ OS SYSTEM*
├───────────────⊷
│ Quoted message is not a
│ valid View Once file.
╰───────────────⊷
_*POWERED BY LANEZ*_`;
                    return sock.sendMessage(from, { text: invalidText }, { quoted: msg });
                }

                console.log(`🔓 Extracting View Once media via .ok from: ${from}`);

                // Download raw media buffer
                const buffer = await downloadMediaMessage(
                    { message: targetMedia },
                    'buffer',
                    {}
                );

                // Clean response layout
                const captionText = `
╭───────────────⊷
│ 🔓 *VIEW ONCE SAVED*
├───────────────⊷
│ • Status: Success ✅
│ • Engine: LANEZ OS
╰───────────────⊷
_*POWERED BY LANEZ*_`;

                // Send permanent copy back to the chat
                if (type.includes('image')) {
                    await sock.sendMessage(from, { image: buffer, caption: captionText }, { quoted: msg });
                } else if (type.includes('video')) {
                    await sock.sendMessage(from, { video: buffer, caption: captionText }, { quoted: msg });
                } else if (type.includes('audio')) {
                    await sock.sendMessage(from, { audio: buffer, mimetype: 'audio/mp4', ptt: false }, { quoted: msg });
                }

            } catch (err) {
                console.error('Failed to process .ok command:', err.message);
                const failText = `
╭───────────────⊷
│ ❌ *EXTRACTION FAILED*
├───────────────⊷
│ Could not process media.
╰───────────────⊷
_*POWERED BY LANEZ*_`;
                await sock.sendMessage(from, { text: failText }, { quoted: msg });
            }
        });

    } catch (err) {
        console.error('Bot init error:', err);
    }
}

module.exports = { startBot };
                
