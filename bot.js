const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const pino = require('pino');
const COMMANDS = require('./commands'); // External command array

const OWNER_NUM = '233597789459';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_lanez');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: ['LANEZ OS', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('🟢 LANEZ OS Connected successfully!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg || !msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;

            // 1. EXTRACT SENDER (Required for Owner Commands)
            const sender = msg.key.participant || msg.key.remoteJid;
            const cleanSender = sender.replace(/[^0-9]/g, '');
            const isOwner = cleanSender === OWNER_NUM;

            // 2. EXTRACT TEXT CONTENT
            const body = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text || 
                         msg.message.imageMessage?.caption || 
                         msg.message.videoMessage?.caption || '';

            const prefix = '.';
            if (!body.startsWith(prefix)) return;

            const args = body.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            // 3. FETCH GROUP METADATA
            const isGroup = from.endsWith('@g.us');
            let participants = [];
            if (isGroup) {
                try {
                    const groupMetadata = await sock.groupMetadata(from);
                    participants = groupMetadata.participants || [];
                } catch (e) {
                    console.error('Failed to fetch group metadata:', e);
                }
            }

            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            // =========================================================
            // INLINE COMMANDS (Commands built directly into bot.js)
            // =========================================================
            switch (commandName) {
                case 'hi':
                case 'hello':
                    await sock.sendMessage(from, { text: ' 👋 Hello! LANEZ OS is active.' });
                    return;

                case 'ownercheck':
                    if (!isOwner) {
                        await sock.sendMessage(from, { text: '❌ Access Denied: Owner only.' });
                        return;
                    }
                    await sock.sendMessage(from, { text: `👑 Welcome Owner! ID: ${cleanSender}` });
                    return;

                // Add any other inline commands from your old bot.js here
            }

            // =========================================================
            // EXTERNAL COMMANDS (Loaded from commands.js)
            // Handles .play, .video, .imgsearch, owner commands, etc.
            // =========================================================
            const cmd = COMMANDS.find(c => c.name === commandName);
            if (cmd) {
                await cmd.exec({
                    sock,
                    from,
                    args,
                    msg,
                    sender, // Pass full sender ID for checkIsOwner inside commands.js
                    mentioned,
                    participants
                });
            }

        } catch (err) {
            console.error('Error in message handler:', err);
        }
    });
}

startBot();
