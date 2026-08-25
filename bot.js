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
                console.log('✅ Connected to WhatsApp! Silent View-Once DM Route Active.');
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

                // Determine bot owner JID (Your own DM target)
                const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

                // Extract quoted message context
                const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (!quotedMsg) {
                    // Send error secretly to your own DM
                    const errorText = `
╭───────────────⊷
│ ❌ *LANEZ OS SYSTEM*
├───────────────⊷
│ Reply to a View Once 
│ message with *.ok*
╰───────────────⊷
_*POWERED BY LANEZ*_`;
                    return sock.sendMessage(ownerJid, { text: errorText });
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
                    return sock.sendMessage(ownerJid, { text: invalidText });
                }

                console.log(`🔓 Extracting View Once media silently to Owner DM...`);

                // Download raw media buffer
                const buffer = await downloadMediaMessage(
                    { message: targetMedia },
                    'buffer',
                    {}
                );

                // Clean response caption
                const captionText = `
╭───────────────⊷
│ 🔓 *VIEW ONCE SAVED*
├───────────────⊷
│ • Status: Success ✅
│ • Engine: LANEZ OS
╰───────────────⊷
_*POWERED BY LANEZ*_`;

                // Forward extracted media directly to YOUR personal DM
                if (type.includes('image')) {
                    await sock.sendMessage(ownerJid, { image: buffer, caption: captionText });
                } else if (type.includes('video')) {
                    await sock.sendMessage(ownerJid, { video: buffer, caption: captionText });
                } else if (type.includes('audio')) {
                    await sock.sendMessage(ownerJid, { audio: buffer, mimetype: 'audio/mp4', ptt: false });
                }

            } catch (err) {
                console.error('Failed to process .ok command:', err.message);
                const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                const failText = `
╭───────────────⊷
│ ❌ *EXTRACTION FAILED*
├───────────────⊷
│ Could not process media.
╰───────────────⊷
_*POWERED BY LANEZ*_`;
                await sock.sendMessage(ownerJid, { text: failText });
            }
        });

    } catch (err) {
        console.error('Bot init error:', err);
    }
}

module.exports = { startBot };
                                         
