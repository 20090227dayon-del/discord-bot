const express = require('express');
const bodyParser = require('body-parser');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
app.use(express.json());

// ===== Discord設定 =====
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = '1237372571679199313';

// ロールID
const ROLE_MEMBER = '1449732823765487729';
const ROLE_GRAD = '1356950289520787532';
const ROLE_NOTIFY = '1475804128805523608';

// ===== Bot起動 =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.login(TOKEN);

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ===== Webhook受信 =====
app.post('/webhook', async (req, res) => {
  try {
    const { discordId, roleStatus, notifyFlag } = req.body;

    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(discordId);

    await member.roles.add(ROLE_MEMBER);

    if (roleStatus.includes('卒業生')) {
      await member.roles.add(ROLE_GRAD);
    }

    if (notifyFlag === true || notifyFlag === 'はい') {
      await member.roles.add(ROLE_NOTIFY);
    }

    await member.send('登録ありがとうございます！ロール付与が完了しました。');

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});