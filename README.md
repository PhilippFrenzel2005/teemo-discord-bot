# Genosse Teemoshenko – Discord Bot

A hobby Discord bot built with discord.js v14 and Google Gemini AI. Features an AI-powered chat persona based on Teemo from League of Legends

---

## Features

- **AI Chat** – Talk to Genosse Teemoshenko via slash command or @mention. Powered by Gemini 2.5 Flash.
- **Persistent Conversation History** – The bot remembers context per user within a session.
- **Champion Build Advisor** – Get AI-generated meta builds for any LoL champion.
- **Custom User Personalities** – Specific users get tailored responses (roasts or respect).
- **Keyword Reactions** – Reacts to messages containing certain words.
- **Prefix Commands** – Basic `!hilfe` and `!wiederhole` commands.

---

## Commands

| Command | Description |
|---|---|
| `/teemo chat <message>` | Chat with Genosse Teemoshenko |
| `/teemo vergessen` | Resets the conversation history |
| `/build <champion> [lane]` | AI-generated meta build for any champion (op.gg api) |
| `/ping` | Shows bot latency |
| `/info server` | Server information |
| `/info user [@user]` | User information |
| `/würfeln [sides]` | Roll a dice (d6 to d1000) |
| `!hilfe` | Prefix command overview |
| `!wiederhole <text>` | Repeats your text |

---

## Setup

1. Clone the repo
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file:
   ```
   DISCORD_TOKEN=your_token
   CLIENT_ID=your_client_id
   GUILD_ID=your_guild_id
   GEMINI_API_KEY=your_gemini_key
   ```
4. Register slash commands:
   ```
   node deploy-commands.js
   ```
5. Start the bot:
   ```
   node index.js
   ```

---

## Stack

- [discord.js v14](https://discord.js.org)
- [Google Gemini API (@google/genai)](https://ai.google.dev)
- [dotenv](https://github.com/motdotla/dotenv)

---

