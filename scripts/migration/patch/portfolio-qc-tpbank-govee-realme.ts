/**
 * QC patch for three ZH portfolio pages (TPBank / Govee Halloween / realme 15).
 *
 * Fixes bad TRP glosses (城规银行), additional-video ZH fields, and Realme long title.
 *
 *   npx tsx scripts/migration/patch/portfolio-qc-tpbank-govee-realme.ts
 */

import { getWriteClient, patchSet } from '../lib/sanity-client';

const PATCHES: {
  slug: string;
  set: Record<string, unknown>;
  patchAdditionalVideos?: (
    videos: Array<Record<string, unknown>>,
  ) => Array<Record<string, unknown>>;
}[] = [
  {
    slug: 'tpbank-chatpay',
    set: {
      // Override bad TRP "城规银行应用程序" — brand stays TPBank; App → 应用程序
      titleZh: 'TPBank 应用程序',
      thumbTitleZh: 'TPBank<br>应用程序',
      headerTitleZh: 'TPBank <span> 应用程序 </span>',
      // From TRP: "TPBank ChatPay" + "… – Chuyển tiền y như chat"
      longTitleZh: 'TPBank 聊天支付 <span> 转账就像聊天 </span>',
    },
    patchAdditionalVideos: (videos) =>
      videos.map((v, i) => {
        if (i !== 0) return v;
        return {
          ...v,
          // TRP: "TPBank – 5 phút có thẻ xài ngay" → "TPBank – 5分钟即可使用"
          longTitleZh: 'TPBank <span>5分钟即可使用</span>',
          descriptionZh:
            '演唱会临近 — 必须马上抢购偶像的门票，而申请信用卡需要等待 5-7 天？？怎么来得及追偶像？？立即在 TPBank App 上申请信用卡吧！',
        };
      }),
  },
  {
    slug: 'govee-halloween',
    set: {
      // Align long title with EN span structure + TRP phrases
      longTitleZh: 'Govee <span> 与戈伟一起闪耀 </span>万圣节的终极装饰',
      descriptionZh:
        '在 Govee 的“闪耀 Govee”万圣节 2025 宣传活动中，我们为智能照明世界带来了十足的电影风格。在四部主题影片中，我们的团队将普通家庭变成了阴森恐怖的电影展示厅，每一个闪烁、色调和光芒都在诉说着自己的诡异故事。从雾气弥漫的车道到舞动的幽灵灯，该系列展示了 Govee 广泛的室外和室内照明产品，证明只要设置得当，就能将您的家变成终极闹鬼奇观。',
    },
    patchAdditionalVideos: (videos) =>
      videos.map((v) => ({
        ...v,
        longTitleZh: 'Govee <span>万圣节 x Amazon Alexa </span>',
      })),
  },
  {
    slug: 'realme-15-series-5g-live-real-in-every-shot',
    set: {
      // TRP: "Live Real in Every Shot" → "在每一拍中真实呈现"
      longTitleZh: '真我 15 系列 5G <span> 在每一拍中真实呈现 </span>',
    },
  },
];

async function main() {
  const client = getWriteClient();

  for (const entry of PATCHES) {
    const doc = await client.fetch<{
      _id: string;
      additionalVideos?: Array<Record<string, unknown>>;
    } | null>(
      `*[_type=="portfolioEntry" && slug.current==$slug][0]{_id, additionalVideos}`,
      { slug: entry.slug },
    );
    if (!doc?._id) {
      console.error(`Missing: ${entry.slug}`);
      continue;
    }

    const set = { ...entry.set };
    if (entry.patchAdditionalVideos && doc.additionalVideos?.length) {
      set.additionalVideos = entry.patchAdditionalVideos(doc.additionalVideos);
    }

    await patchSet(doc._id, set);
    console.log(`Patched ${entry.slug}`, Object.keys(set).join(', '));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
