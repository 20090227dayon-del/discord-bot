const express = require('express');
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
const ROLE_HIGH = '1493321165974802452';
const ROLE_MIDDLE = '1493321311743774921';
const ROLE_EXTERNAL = '1449645961218490479';
const ROLE_VISITOR = '1449646076532494398';

// ===== Bot起動 =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.login(TOKEN);

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ===== Webhook受信 =====
app.post('/webhook', async (req, res) => {
  try {
    const { discordId, roleStatus, notifyFlag, type, message } = req.body;

    console.log("受信:", req.body);

    const guild = await client.guilds.fetch(GUILD_ID);

    let member;
    try {
      member = await guild.members.fetch(discordId);
    } catch (e) {
      console.log("member取得失敗:", discordId);
      return res.sendStatus(200);
    }

    // ===== INVALID DM =====
    if (type === 'INVALID') {
      try {
        await member.send(message);
      } catch {
        console.log("DM送信失敗:", discordId);
      }
      return res.sendStatus(200);
    }

    // ===== 正規化 =====
    const normalized = String(roleStatus || '')
      .trim()
      .replace(/（/g, '(')
      .replace(/）/g, ')');

    console.log("normalized:", normalized);

    const isHigh = normalized === '在校生(高)';
    const isMiddle = normalized === '在校生(中)';
    const isGrad = normalized === '卒業生';
    const isExternal = normalized === '外部生';

    // =========================
    // 🎯 ロール付与
    // =========================

    // 登録メンバー
    if (!member.roles.cache.has(ROLE_MEMBER)) {
      await member.roles.add(ROLE_MEMBER);
    }

    // 在校生(高)
    if (isHigh) {
      console.log("HIGH判定");

      try {
        await member.roles.add(ROLE_HIGH);
        console.log("HIGH付与成功");
      } catch (e) {
        console.log("HIGH付与失敗", e);
      }

      if (member.roles.cache.has(ROLE_MIDDLE)) {
        await member.roles.remove(ROLE_MIDDLE);
      }
    }

    // 在校生(中)
    if (isMiddle) {
      console.log("MIDDLE判定");

      try {
        await member.roles.add(ROLE_MIDDLE);
        console.log("MIDDLE付与成功");
      } catch (e) {
        console.log("MIDDLE付与失敗", e);
      }

      if (member.roles.cache.has(ROLE_HIGH)) {
        await member.roles.remove(ROLE_HIGH);
      }
    }

    if (type === 'CUSTOM_DM') {
      try {
      await member.send(message);
      } catch {
      console.log(`DM送信失敗: ${discordId}`);
      }
      return res.sendStatus(200);
      }


    // 卒業生
    if (isGrad) {
      await member.roles.add(ROLE_GRAD);
      await member.roles.remove(ROLE_HIGH);
      await member.roles.remove(ROLE_MIDDLE);
    }

    // 外部生
    if (isExternal) {
      await member.roles.add(ROLE_EXTERNAL);
      await member.roles.remove(ROLE_HIGH);
      await member.roles.remove(ROLE_MIDDLE);
    }

    // ビジター削除
    if (member.roles.cache.has(ROLE_VISITOR)) {
      await member.roles.remove(ROLE_VISITOR);
    }

    // 通知ロール
    const isNotify =
      notifyFlag === true ||
      notifyFlag === 'true' ||
      notifyFlag === 'はい';

    if (isNotify && !member.roles.cache.has(ROLE_NOTIFY)) {
      await member.roles.add(ROLE_NOTIFY);
    }

    // =========================
    // 📩 DM分岐
    // =========================
    let dmMessage = '';

    if (type === 'NEW') {
      dmMessage =
`こちらは、エヴァ同好会のメンバー籍自動登録システム @𝑀𝐴𝐺𝐼-𝟭 です。\nこの度の籍のご登録、誠にありがとうございます！\n不明点やエラーなどありましたら、会長 @watarinirataw までDMでご連絡ください！`;
    }

    if (type === 'REREG') {
      dmMessage =
`こちらは、エヴァ同好会のメンバー籍自動登録システム @𝑀𝐴𝐺𝐼-𝟭 です。\nこの度の籍の再登録を受理し、ロールを更新いたしました。\n不明点やエラーなどありましたら、会長 @watarinirataw までDMでご連絡ください！`;
    }

    if (dmMessage) {
      try {
        await member.send(dmMessage);
      } catch {
        console.log("DM送信失敗:", discordId);
      }
    }

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});