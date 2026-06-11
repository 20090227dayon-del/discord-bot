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



// =========================
// 🚨 管理者通知関数
// =========================

async function sendAdminReview(body) {

  const adminChannel =
    await client.channels.fetch("1504632169627259030");

  const roleMention =
    "<@&1454874636763529379>";

  // =========================
  // カテゴリ表示
  // =========================

  const categoryMap = {

    INVITER:
      "未確認招待リンク",

    INVITER_REMINDER:
      "未確認招待リンク（未処理リマインダー）",

    SLACK:
      "Slackアカウント確認",

    SLACK_REMINDER:
      "Slackアカウント確認（未処理リマインダー）",

    BLACKLIST:
      "ブラックリスト検知",

    BLACKLIST_REMINDER:
      "ブラックリスト（未処理リマインダー）",

    SUBACCOUNT:
      "サブ垢登録",

    SUBACCOUNT_REMINDER:
      "サブ垢登録（未処理リマインダー）",

    CHANGE:
      "変更申請",

    CHANGE_REMINDER:
      "変更申請（未処理リマインダー）",

    DELETE:
      "削除申請",

    DELETE_REMINDER:
      "削除申請（未処理リマインダー）"
  };

  const categoryText =
    categoryMap[body.category]
    || "要確認送信";

  // =========================
  // Invitation表示
  // =========================

  let invitationSection = "";

  if (body.invitationStatus) {

    invitationSection =
`
【Invitation Status】
${body.invitationStatus}
`;
  }

// =========================
// ヘッダー
// =========================

const header =
  body.type === "ADMIN_REMINDER"
    ? "⏰ 管理者確認リマインダー"
    : "🚨 管理者確認通知";

// =========================
// 送信
// =========================

await adminChannel.send({

  content:
`${roleMention}

${header}

${categoryText}

【Discord表示名】
${body.discordName}

【DiscordユーザーID】
${body.discordId}

【PersonID】
${body.personId}
${invitationSection}
`
});
}

// ===== Webhook受信 =====
app.post('/webhook', async (req, res) => {
  try {

    const body = req.body;

    const {
      discordId,
      roleStatus,
      notifyFlag,
      type,
      message
    } = body;

    console.log("受信:", body);

if (type === 'SYNC_ALL_MEMBERS') {

  const guild =
    await client.guilds.fetch(
      GUILD_ID
    );

  const members =
    await guild.members.fetch();

  const visitorIds =
    members
      .filter(member =>
        member.roles.cache.has(
          ROLE_VISITOR
        )
      )
      .map(member => member.id);

  const noRoleIds =
    members
      .filter(member =>
        member.roles.cache.size === 1
      )
      .map(member => member.id);

  return res.json({
    success: true,
    visitorIds,
    noRoleIds
  });
}

if (type === 'VISITOR_REMINDER') {

  const guild =
    await client.guilds.fetch(GUILD_ID);


  try {

    

    const member =
      await guild.members.fetch(discordId);

if (
  !member.roles.cache.has(
    ROLE_VISITOR
  )
) {

  return res.send(
    'NOT_VISITOR'
  );
}

    await member.send(
`こちらは、エヴァ同好会のメンバー籍自動登録システム @𝑀𝐴𝐺𝐼-𝟭 です。

現在、ビジターロールの付与から12日が経過しています。

ビジター期間は2週間（14日間）となっており、
期間終了後もメンバー籍のご登録がない場合は
自動的にサーバーからキックされます。

継続的な参加をご希望の場合は、
下記リンクよりお早めに籍のご登録をお願いいたします。
フォームのリンク→ https://forms.gle/K39GFbds1BWgLTMx7 

何卒、ご協力をお願いいたします。

ご不明な点がございましたら、
管理者まで遠慮なくお問い合わせください。
※このDMと行き違いで既に登録済みの場合は、
ご容赦ください。`
    );

    return res.send(
      'REMINDER_SENT'
    );

  } catch (e) {

    console.log(
      'VISITOR REMINDER FAILED',
      discordId,
      e
    );

    return res.send(
      'REMINDER_FAILED'
    );
  }
}

if (type === 'SYNC_NO_ROLE') {

  const guild =
    await client.guilds.fetch(
      GUILD_ID
    );

  const members =
    await guild.members.fetch();

  const noRoleIds =
    members
      .filter(member => {

        const roleCount =
          member.roles.cache.size;

        return roleCount === 1;
      })
      .map(member => member.id);

  return res.json({
    success: true,
    noRoleIds
  });
}

// =========================
// Visitor期限切れキック
// =========================

if (type === 'AUTO_KICK') {

  const guild =
    await client.guilds.fetch(GUILD_ID);

  try {

    const member =
      await guild.members.fetch(discordId);

    // Visitorのみ対象
    if (
      !member.roles.cache.has(
        ROLE_VISITOR
      )
    ) {

      return res.send(
        'NOT_VISITOR'
      );
    }

try {

  await member.send(
`こちらは、エヴァ同好会のメンバー籍自動登録システム @𝑀𝐴𝐺𝐼-𝟭 です。

ビジター期間（2週間）が終了し、
期間内に籍のご登録が確認できなかったため、
サーバーからキックしました。

今後、再度参加をご希望の場合は、
改めてサーバーへご参加ください。
その際、継続的な参加を希望される場合は籍のご登録をお願いいたします。

何卒、ご協力をお願いいたします。
ご不明な点がございましたら、
会長 @watarinirataw までお問い合わせください。`
  );

} catch (e) {

  console.log(
    'KICK DM FAILED',
    discordId
  );
}

await member.kick(
  'Visitor期限切れ'
);

return res.send(
  'KICK_SUCCESS'
);

  } catch (e) {

    console.log(e);

    return res.send(
      'KICK_FAILED'
    );
  }
}

if (type === 'NO_ROLE_KICK') {

  const guild =
    await client.guilds.fetch(
      GUILD_ID
    );

  try {

    const member =
      await guild.members.fetch(
        discordId
      );

    if (
      member.roles.cache.size > 1
    ) {

      return res.send(
        'HAS_ROLE'
      );
    }

    await member.kick(
      'No Role User'
    );

    return res.send(
      'KICK_SUCCESS'
    );

  } catch (e) {

    console.log(e);

    return res.send(
      'KICK_FAILED'
    );
  }
}

// =========================
// ブラックリストキック
// =========================

if (type === 'BLACKLIST_KICK') {

  const guild =
    await client.guilds.fetch(GUILD_ID);

  try {

    const member =
      await guild.members.fetch(discordId);

    await member.kick(
      'BLACKLIST'
    );

    return res.send(
      'KICK_SUCCESS'
    );

  } catch (e) {

    console.log(e);

    return res.send(
      'KICK_FAILED'
    );
  }
}

   // =========================
// 🚨 管理者確認通知
// =========================

if (
  type === "ADMIN_REVIEW" ||
  type === "ADMIN_REMINDER"
) {

  await sendAdminReview(body);

  return res.send("ADMIN MESSAGE SENT");
}

    // ===== ここから既存処理 =====

    const guild = await client.guilds.fetch(GUILD_ID);

    let member;

    try {
      member = await guild.members.fetch(discordId);
    } catch (e) {
      console.log("member取得失敗:", discordId);
      return res.sendStatus(200);
    }

    // 以下既存コード...

    // ===== INVALID DM =====
    if (type === 'INVALID') {
      try {
        await member.send(message);
      } catch {
        console.log("DM送信失敗:", discordId);
      }
      return res.sendStatus(200);
    }

    if (type === 'CUSTOM_DM') {
      try {
      await member.send(message);
      } catch {
      console.log(`DM送信失敗: ${discordId}`);
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

if (
  member.roles.cache.has(
    ROLE_VISITOR
  )
) {

  await member.roles.remove(
    ROLE_VISITOR
  );
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