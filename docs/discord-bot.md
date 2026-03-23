# Discord Bot

The Cortex Discord bot watches channels for URLs and saves them to your knowledge base automatically. It also exposes commands for searching and querying your knowledge base directly from Discord.

## Setup

### 1. Create a Discord application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) and click **New Application**.
2. Give it a name (e.g. "Cortex") and click **Create**.
3. In the left sidebar, click **Bot**.
4. Click **Reset Token**, confirm, and copy the token. This is your `DISCORD_TOKEN`.
5. Under **Privileged Gateway Intents**, enable **Message Content Intent**. This is required — without it, the bot cannot read message text and will fail to detect URLs.

### 2. Required bot permissions

When inviting the bot to a server, it needs these permissions:

- Read Messages / View Channels
- Send Messages
- Add Reactions
- Read Message History

The slash command `/map` additionally requires the invoking user to have **Manage Channels** permission.

### 3. Invite the bot to a server

1. In your application page, go to **OAuth2 → URL Generator**.
2. Under **Scopes**, select `bot` and `applications.commands`.
3. Under **Bot Permissions**, select: **Read Messages/View Channels**, **Send Messages**, **Add Reactions**, **Read Message History**.
4. Copy the generated URL and open it in a browser to invite the bot to your server.

### 4. Configure the environment

Add the bot token to your `.env` file:

```bash
DISCORD_TOKEN=your_bot_token_here
```

Make sure `API_KEY` is also set in `.env` — the bot authenticates against the Cortex API using it.

### 5. Start the bot

**With Docker Compose:**

```bash
docker compose up discord-bot -d
```

The bot service depends on the `app` service being healthy, so the full stack must be running.

**For local development:**

```bash
cd discord-bot
npm install
npm run dev
```

The bot requires `DISCORD_TOKEN`, `API_KEY`, and `API_URL` environment variables (or a `.env` file in the `discord-bot/` directory).

---

## How It Works

### URL Detection

The bot listens to every message in every channel it has access to. When a message contains one or more `http://` or `https://` links, the bot automatically processes each URL.

Any text in the message that is not a URL is treated as user notes and attached to the saved item.

### Reaction Workflow

| Reaction | Meaning |
|---|---|
| ⏳ | URL detected, ingestion in progress |
| ✅ | Successfully saved and processed |
| ❌ | Processing failed |

On success, the bot removes the ⏳ reaction, adds ✅, and replies with an embed showing the item title, summary, category, and tags.

On failure, the bot removes ⏳, adds ❌, and replies with an error embed.

### Duplicate Handling

If a URL has already been saved to your knowledge base, the API returns HTTP 409. The bot reacts with ✅ (since the item is already available) and replies with an amber "Already saved" embed containing the URL.

### Processing Timeout

The bot polls the item's processing status after submission. By default it polls every 3 seconds for up to 60 seconds. If processing has not completed within that window, the bot replies with a yellow "Processing taking longer than expected" embed containing the item ID — you can check back in the web UI later.

These timeouts are configurable via environment variables on the `discord-bot` service:

| Variable | Default | Description |
|---|---|---|
| `POLL_TIMEOUT_MS` | `60000` | Maximum time (ms) to wait for processing to complete |
| `POLL_INTERVAL_MS` | `3000` | How often (ms) to check processing status |

---

## Commands

The bot supports both prefix commands (starting with `!`) and slash commands (starting with `/`). Both have identical behavior. Slash commands are automatically registered on startup for each server the bot is in.

### `!search <query>` / `/search`

Performs semantic search across your knowledge base and returns the top 5 results.

If the command is used in a channel that is mapped to a category (see Channel Mapping below), the search is automatically scoped to that category.

**Example:**
```
!search React Server Components
```

**Slash command options:**
- `query` (required) — the search query
- `category` (optional) — category slug to filter results

**Response:** A Discord embed with up to 5 results, each showing the title, a truncated summary, a link, and a relevance score.

---

### `!ask <question>` / `/ask`

Asks a natural language question using RAG (retrieval-augmented generation). Cortex retrieves relevant items from the knowledge base and uses an AI model to synthesize an answer with source citations.

If used in a mapped channel, the search is scoped to that category.

**Example:**
```
!ask What are the tradeoffs between fine-tuning and RAG?
```

**Slash command options:**
- `question` (required) — the question to ask
- `category` (optional) — category slug to restrict the knowledge search

**Response:** An embed with the AI-generated answer and up to 3 source links.

> **Note:** While the bot waits for the AI response, it adds a 🤔 reaction to the message. This is removed before the answer embed is posted.

---

### `!recent [category]` / `/recent`

Shows the 5 most recently saved items, optionally filtered by category.

**Example:**
```
!recent
!recent ai-ml
```

**Slash command options:**
- `category` (optional) — category slug to filter

**Response:** An embed listing up to 5 items with titles, links, source types, and dates.

---

### `!categories` / `/categories`

Lists all categories in the knowledge base with their item counts.

**Example:**
```
!categories
```

**Response:** An embed listing each category name, slug, and item count.

---

### `!map <category-slug>` / `/map`

Maps the current channel to a category. Requires the **Manage Channels** Discord permission.

After mapping, any URL shared in the channel will automatically be assigned to the specified category. This also scopes `!search` and `!ask` commands to that category when used in the channel.

**Example:**
```
!map ai-ml
```

**Slash command options:**
- `category` (required) — the category slug to map to this channel

**Response:** A green "Channel mapped" confirmation embed.

---

## Channel Mapping

Channel mapping lets you organize URLs automatically based on which channel they are shared in.

**How it works:**
1. Use `/map <category-slug>` in the channel you want to configure.
2. From that point forward, any URL shared in that channel is tagged with the mapped category.
3. `!search` and `!ask` commands in a mapped channel automatically scope to that category.

**Where mappings are stored:** Channel-to-category mappings are stored via the Cortex API (`/api/channels`). The bot caches the mapping list in memory and refreshes it as needed. Running `/map` immediately invalidates the local cache.

**Example workflow:**
- Map `#ai-papers` to `ai-ml`
- Map `#devops-tools` to `devops`
- Map `#front-end` to `web-development`

Any link dropped in `#ai-papers` will land in the AI/ML category without any manual tagging.
