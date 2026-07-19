/**
 * Fill blog titleZh gaps + bodyHtmlZh via TranslatePress, then patch Sanity.
 *
 * Missing titles sourced from live news index (2026-07).
 * Bodies rebuilt with translateBodyHtml (segment dictionary + curated overrides
 * for the few TRP dictionary gaps).
 *
 *   npx tsx scripts/migration/patch/blog-translations-zh.ts
 */

import { JSDOM } from 'jsdom';
import path from 'node:path';
import { PATHS } from '../config';
import { closePool } from '../db';
import type { ExportedBlogPost } from '../export/blog-posts';
import { readJson, writeJson } from '../lib/fs';
import { htmlToPortableText } from '../lib/html-to-pt';
import { loadIdMap } from '../lib/id-map';
import { blogPostId } from '../lib/ids';
import { patchSet } from '../lib/sanity-client';
import {
  cleanTrpArtifacts,
  normalizeLookupKey,
  normalizeWhitespace,
} from '../lib/translation-text';
import { translateBodyHtml } from '../lib/translatepress';
import { mergeChineseBodyWithEnglishMedia } from '../../../src/lib/portable-text-media';

/** Live ZH titles for posts with no TRP dictionary hit. */
const LIVE_TITLE_ZH: Record<number, string> = {
  3370: "ASUS Business 在 Byron McKenzie 指导的广告中邀您『升级至非凡』",
  3423: "realme 推出幽默混乱的全新 C75『防意外』广告",
  4500: '’Vantage Pictures”与“James Duong”谈将中国作品引入越南',
};

/**
 * Full-paragraph Chinese for body segments missing from the TRP dictionary.
 * Keys are English plain text (normalizeLookupKey applied at match time).
 */
const SEGMENT_ZH_OVERRIDES: Record<string, string> = {
  'In May 2022, Shenzhen-based battery manufacturer EcoFlow launched a new crowdfunding campaign for DELTA Pro, its most disruptive portable power solution to date.':
    '2022 年 5 月，总部位于深圳的电池制造商正浩 EcoFlow 为迄今为止最具颠覆性的便携储能方案 DELTA Pro 发起了一场全新的众筹活动。',

  '3,167 backers pledged more than $12 million $1 million pledged in the first hour $3 million pledged within the first day':
    '3,167 名支持者承诺出资超过 1,200 万美元：首小时筹集 100 万美元，首日筹集达 300 万美元。',

  'As Kickstarter asserts in their blog, "A video is by far the best way to get a feel for the emotions, motivations and character of a project. It\'s a demonstration of effort and a good predictor of success."':
    '正如 Kickstarter 在其博客中所强调的：“视频是感受一个项目情感、动机与特质的最佳方式。它展示了付出的努力，也是项目成败的有力预测指标。”',

  'The shoot itself was equally intense: 48 shots across two days, all in-studio in Ho Chi Minh City, Vietnam. Director of Photography Tóth Widamon Máté shot largely on steadicam to ensure fluid motion and rapid resets, adding production value without sacrificing speed. And with MSI\'s team based in Taiwan, the shoot was entirely remote, with a live-streamed client monitor keeping things seamless across borders.':
    '拍摄本身同样高强度：两天内完成 48 个镜头，全部在越南胡志明市影棚内完成。摄影指导 Tóth Widamon Máté 大量使用斯坦尼康，以保证运镜流畅、快速重设机位，在不牺牲节奏的前提下提升制作质感。由于 MSI 团队远在台湾，整场拍摄完全远程协作，通过直播客户监视器实现跨境无缝沟通。',

  "My all time favourite TVC is probably Guinness – The Surfer. I think it's a visual masterpiece that powerfully captures the brand messaging and draws on themes of struggle, patience and triumph, making it not only incredibly memorable but also relatable. Many ads today are inspired by other ads but this commercial's inspiration was art and literature.":
    '我心目中最爱的电视广告大概是 Guinness 的 The Surfer。我觉得它是一部视觉杰作，有力地捕捉了品牌信息，并借由奋斗、耐心与胜利的主题，既令人难忘又十分有共鸣。如今许多广告是从别的广告里找灵感，但这支片子的灵感来自艺术与文学。',

  "First, Microsoft's Surface Laptop Studio launch film. It nails everything I want in a tech product ad: clean, minimalist design; sleek motion control that pulls us through the product like a theme park ride; and seamlessly integrated macro CGI that reveals internal hardware in a way that's both informative and mesmerizing. It's fun to watch but still communicates key selling points clearly. The \"Pure Imagination\" cover was also a perfect music choice—emotive without being overbearing. I've referenced that film more times than I can count.":
    '首先是微软 Surface Laptop Studio 的发布影片。它精准地打到了我对科技产品广告的所有期待：干净极简的设计；流畅的运动控制，像主题乐园轨道一样把我们带进产品；还有无缝衔接的微距 CGI，以既有信息量又令人着迷的方式揭开内部硬件。它好看，但仍清楚传达卖点。“Pure Imagination”翻唱也是绝佳配乐选择——有情感却不喧宾夺主。我参考这部片子的次数多到数不清。',

  'ASUS Zenbook\'s "Incredible Comes From Within" is one of my favorite examples of a branded documercial done right. Reuben Wu\'s surreal light-painting visuals speak for themselves. Anna Smoronova is a phenomenal DOP, balancing energy with space to breathe. You get chaotic close-ups, fast-cut FPV transitions, then suddenly you\'re lingering on vast, cinematic wides. That emotional rhythm suits the thematic blend of innovation, nature, and craftsmanship perfectly. It doesn\'t feel like an ad—it feels like a glimpse into something real. That\'s always the tone I aim for in my own docu-style work.':
    '华硕 Zenbook 的《Incredible Comes From Within》是我最喜欢的“品牌纪录片式广告”范例之一。Reuben Wu 超现实的光绘影像本身就极具说服力。Anna Smoronova 作为摄影指导非常出色，在能量与留白之间拿捏得当。你会看到混乱的特写、快切的 FPV 转场，然后突然停在辽阔的电影感大远景上。这种情绪节奏与创新、自然与匠心的主题融合得恰到好处。它不像广告——更像瞥见某种真实的事物。这正是我在自己纪录风格作品里始终追求的调性。',

  'Directed by Zacharia Lorenz, co-founder of Vantage Pictures, and shot by Singaporean cinematographer Kelvin Chew, the campaign taps into Southeast Asia\'s working-class spirit while maintaining a premium cinematic feel. Set against the vibrant streets of Vietnam, from roadside eateries to narrow tube houses and the constant flow of motorbikes, the film captures the region\'s unique rhythm and color, blended with English signage to keep it globally accessible.':
    '这部广告由 Vantage Pictures 联合创始人 Zacharia Lorenz 执导，新加坡摄影师 Kelvin Chew 掌镜。活动在保持高级电影质感的同时，切入东南亚工人阶级的精神气质。故事背景落在越南色彩鲜明的街巷——路边小馆、窄长的管屋，以及川流不息的摩托车——影像捕捉了当地独特的节奏与色彩，并混入英文标识，使其仍具全球可读性。',

  'BRINC\'s "New Era of Response" film from 2024, also produced by Vantage Pictures, focused on proving the concept of DFR (Drone as First Responder). Guardian aims to show what happens when those systems become fully integrated—autonomous, continuous, and scalable.':
    'BRINC 于 2024 年推出、同样由 Vantage Pictures 制作的《响应新时代》影片，重点在于证明 DFR（无人机作为第一响应者）这一概念。Guardian 则旨在展示当这些系统实现完全整合——自主、持续、可扩展——之后会是怎样的面貌。',

  '“We didn’t want this to be an endless stack of specs and features,” says director Zacharia Lorenz. “The goal was to make the technology feel intuitive, so everything was built around the real workflows of first response teams.”':
    '“我们不希望这是一堆没完没了的技术规格和功能列表，”导演 Zacharia Lorenz 说。“目标是让技术感觉直观，因此一切都围绕一线响应团队的真实工作流程展开。”',

  'One of the key challenges was maintaining a consistent visual language across two very different environments. Cinematographers Erick Turcios (Newport unit) and Tùng Bùi (Saigon unit) aligned early on lensing, color, and lighting strategy to ensure the transition between locations felt seamless.':
    '其中一个关键挑战是在两个截然不同的环境中保持视觉语言的一致性。摄影师 Erick Turcios（纽波特组）与 Tùng Bùi（西贡组）很早就在镜头、色彩与灯光策略上达成一致，以确保不同拍摄地之间的切换感觉连贯。',

  'That pivot set the tone for the entire production. By reframing the Luba 3 as a piece of high-performance technology rather than a purely functional tool, the Vantage Pictures team were able to build a more elevated visual language around it.':
    '这次的转变定下了整体制作的基调。通过将 Luba 3 重新定位为高性能技术产品，而非单纯的功能性工具，Vantage Pictures 团队得以围绕它构建更高阶的视觉语言。',

  '“The client didn’t want it to feel like a straight-up the product intro,” Odiowei says. “So we focused on ‘showing’ rather than ‘telling.’”':
    '“客户不希望它感觉像一个直白的产品介绍，” Odiowei 说。“所以我们侧重于‘展示’而非‘告知’。”',
};

function applySegmentOverrides(html: string): string {
  const overrides = new Map(
    Object.entries(SEGMENT_ZH_OVERRIDES).map(([k, v]) => [
      normalizeLookupKey(k),
      cleanTrpArtifacts(v),
    ]),
  );

  const dom = new JSDOM(`<body>${html}</body>`);
  const body = dom.window.document.body;
  let changed = false;

  for (const el of body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')) {
    const plain = normalizeWhitespace(el.textContent ?? '');
    if (plain.length < 2) continue;
    const zh = overrides.get(normalizeLookupKey(plain));
    if (!zh) continue;
    el.textContent = zh;
    changed = true;
  }

  return changed ? body.innerHTML : html;
}

async function main() {
  const postsPath = path.join(PATHS.migrationData, 'blog-posts.json');
  const posts = readJson<ExportedBlogPost[]>(postsPath);
  const idMap = loadIdMap();

  let titlePatched = 0;
  let bodyPatched = 0;

  for (const post of posts) {
    const fields: Record<string, unknown> = {};

    if (!post.titleZh && LIVE_TITLE_ZH[post.wpId]) {
      post.titleZh = LIVE_TITLE_ZH[post.wpId];
      fields.titleZh = post.titleZh;
      titlePatched += 1;
    }

    const translated = await translateBodyHtml(post.bodyHtml);
    const bodyHtmlZh = translated
      ? applySegmentOverrides(translated)
      : undefined;
    if (bodyHtmlZh) {
      post.bodyHtmlZh = bodyHtmlZh;
      const bodyEn = htmlToPortableText(post.bodyHtml, idMap) as Array<{
        _type?: string;
        _key?: string;
      }>;
      const bodyZhRaw = htmlToPortableText(bodyHtmlZh, idMap) as Array<{
        _type?: string;
        _key?: string;
      }>;
      fields.bodyZh = mergeChineseBodyWithEnglishMedia(bodyZhRaw, bodyEn);
      bodyPatched += 1;
    }

    if (Object.keys(fields).length) {
      await patchSet(blogPostId(post.wpId), fields);
      console.log(
        `Patched ${post.slug}` +
          (fields.titleZh ? ' [titleZh]' : '') +
          (fields.bodyZh ? ' [bodyZh]' : ''),
      );
    }
  }

  writeJson(postsPath, posts);
  await closePool();

  console.log(
    `Done: ${titlePatched} titleZh, ${bodyPatched} bodyZh of ${posts.length} posts`,
  );
}

main().catch(async (err) => {
  console.error(err);
  await closePool().catch(() => undefined);
  process.exit(1);
});
