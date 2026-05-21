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


## 📌 Verfügbare Commands

| Command | Beschreibung |
|---|---|
| `/ping` | Bot-Latenz anzeigen |
| `/build` | op.gg api zugriff |
| `/info server` | Serverinformationen |
| `/info user [@user]` | Userinfos |
| `/würfeln [seiten]` | Zufallswürfel (W6 bis W1000) |
| `!hilfe` | Prefix-Command-Übersicht |
| `!wiederhole <text>` | Text wiederholen |
