# 🤖 Discord Bot (discord.js v14)

Ein vollständiger Discord-Bot mit **Slash-Commands** und **Nachrichten-Events**.

---

## 📁 Projektstruktur

```
discord-bot/
├── commands/
│   ├── ping.js        → /ping        – Bot-Latenz anzeigen
│   ├── info.js        → /info        – Server- & Userinfos
│   └── würfeln.js     → /würfeln     – Zufallswürfel
├── events/
│   ├── ready.js       → Bot-Start-Event
│   └── messageCreate.js → Nachrichten-Handler
├── index.js           → Einstiegspunkt
├── deploy-commands.js → Slash-Commands registrieren
├── .env               → Tokens & IDs (NIEMALS committen!)
└── package.json
```

---

## 🚀 Setup

### 1. Dependencies installieren
```bash
npm install
```

### 2. Bot auf Discord erstellen
1. Gehe zu [discord.com/developers/applications](https://discord.com/developers/applications)
2. „New Application" → Namen eingeben
3. Unter **Bot**: „Add Bot" → Token kopieren
4. Unter **Bot** → Privileged Gateway Intents:
   - ✅ **Message Content Intent** aktivieren
5. Unter **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Read Message History`, `Use Slash Commands`
   - Link öffnen → Bot zum Server einladen

### 3. .env ausfüllen
```env
DISCORD_TOKEN=dein_bot_token_hier
CLIENT_ID=deine_application_id
GUILD_ID=deine_server_id
```

**Tipp:** Server-ID & Application-ID erhältst du per Rechtsklick (Dev-Modus in Discord-Einstellungen aktivieren).

### 4. Slash-Commands registrieren
```bash
npm run deploy
```

### 5. Bot starten
```bash
npm start
```

---

## ⚙️ Neuen Slash-Command hinzufügen

Neue Datei in `commands/` erstellen:

```js
import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("meincommand")
  .setDescription("Beschreibung hier");

export async function execute(interaction) {
  await interaction.reply("Hallo von meinem Command!");
}
```

Dann `npm run deploy` erneut ausführen – fertig!

---

## 📌 Verfügbare Commands

| Command | Beschreibung |
|---|---|
| `/ping` | Bot-Latenz anzeigen |
| `/info server` | Serverinformationen |
| `/info user [@user]` | Userinfos |
| `/würfeln [seiten]` | Zufallswürfel (W6 bis W1000) |
| `!hilfe` | Prefix-Command-Übersicht |
| `!wiederhole <text>` | Text wiederholen |
