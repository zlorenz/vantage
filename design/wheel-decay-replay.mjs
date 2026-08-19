/**
 * Throwaway replay script — validates idle-timer + direction-reversal unlock
 * against four real Magic Mouse traces.
 * Run: node design/wheel-decay-replay.mjs
 */

const WHEEL_THRESHOLD_PX = 30;
const WHEEL_GESTURE_END_MS = 140;
const SLIDE_DURATION_MS = 300;

function replay(name, events) {
  let locked = false;
  let animating = false;
  let accum = 0;
  let fireCount = 0;
  let animEndTime = 0;
  let lastFireDir = 0; // +1 or -1
  let lastEventTime = 0;

  for (const { t, norm } of events) {
    // Check if animation ended
    if (animating && t >= animEndTime) {
      animating = false;
    }

    // Idle timer: if gap since last event >= WHEEL_GESTURE_END_MS, unlock
    if (locked && !animating && lastEventTime > 0 && (t - lastEventTime) >= WHEEL_GESTURE_END_MS) {
      locked = false;
      accum = 0;
      lastFireDir = 0;
    }
    lastEventTime = t;

    if (animating) {
      continue;
    }

    if (locked) {
      // Direction reversal: if delta opposes the last fire direction, unlock
      const dir = norm > 0 ? 1 : -1;
      if (dir !== lastFireDir) {
        locked = false;
        accum = 0;
        // Fall through to accumulation below
      } else {
        continue;
      }
    }

    // Unlocked path — accumulate
    accum += norm;
    if (Math.abs(accum) < WHEEL_THRESHOLD_PX) {
      continue;
    }

    // Fire!
    fireCount++;
    const dir = accum > 0 ? 1 : -1;
    lastFireDir = dir;
    accum = 0;
    locked = true;
    animating = true;
    animEndTime = t + SLIDE_DURATION_MS;
  }

  console.log(`${name}: ${fireCount} page-advance(s)`);
  return fireCount;
}

// Trace 1: medium swipe, previously advanced 2 slides
const trace1 = [
  {t:2685.5,norm:1},{t:2686.3,norm:3},{t:2695.8,norm:11},{t:2713.7,norm:13},
  {t:2729.4,norm:15},{t:2745.0,norm:16},{t:2750.2,norm:17},{t:2765.9,norm:18},
  {t:2783.6,norm:17},{t:2800.0,norm:17},{t:2816.4,norm:16},{t:2833.2,norm:15},
  {t:2850.2,norm:16},{t:2866.8,norm:15},{t:2883.7,norm:14},{t:2899.9,norm:12},
  {t:2916.2,norm:12},{t:2933.4,norm:11},{t:2949.1,norm:10},{t:2966.4,norm:9},
  {t:2983.5,norm:9},{t:3000.1,norm:8},{t:3016.9,norm:8},{t:3032.9,norm:7},
  {t:3049.5,norm:7},{t:3066.5,norm:6},{t:3082.5,norm:6},{t:3100.1,norm:6},
  {t:3116.8,norm:5},{t:3132.7,norm:5},{t:3150.3,norm:5},{t:3166.3,norm:4},
  {t:3182.7,norm:4},{t:3202.7,norm:4},{t:3216.1,norm:4},{t:3232.8,norm:3},
  {t:3250.2,norm:3},{t:3266.9,norm:3},{t:3283.6,norm:3},{t:3301.2,norm:2},
  {t:3316.1,norm:2},{t:3333.3,norm:2},{t:3350.1,norm:2},{t:3366.9,norm:2},
  {t:3383.5,norm:2},{t:3404.3,norm:2},{t:3416.7,norm:1},{t:3433.1,norm:1},
  {t:3449.7,norm:1},{t:3482.5,norm:1},{t:3499.5,norm:1},{t:3533.0,norm:1},
];

// Trace 2: hard swipe, previously advanced 3 slides
const trace2 = [
  {t:2327.5,norm:1},{t:2345.4,norm:13},{t:2364.1,norm:23},{t:2379.8,norm:37},
  {t:2394.5,norm:65},{t:2413.1,norm:190},{t:2429.4,norm:589},{t:2445.0,norm:536},
  {t:2461.2,norm:568},{t:2478.6,norm:531},{t:2496.2,norm:498},{t:2513.0,norm:469},
  {t:2528.9,norm:441},{t:2547.1,norm:420},{t:2562.0,norm:381},{t:2578.5,norm:365},
  {t:2592.1,norm:351},{t:2611.8,norm:338},{t:2628.6,norm:325},{t:2645.3,norm:311},
  {t:2661.5,norm:296},{t:2676.0,norm:283},{t:2694.8,norm:270},{t:2713.0,norm:256},
  {t:2730.1,norm:244},{t:2746.7,norm:232},{t:2762.4,norm:219},{t:2779.2,norm:205},
  {t:2796.5,norm:190},{t:2812.7,norm:178},{t:2827.8,norm:166},{t:2845.9,norm:154},
  {t:2862.4,norm:143},{t:2879.9,norm:131},{t:2898.0,norm:120},{t:2913.9,norm:112},
  {t:2929.9,norm:104},{t:2945.9,norm:93},{t:2963.7,norm:85},{t:2979.4,norm:77},
  {t:2996.8,norm:70},{t:3014.2,norm:63},{t:3031.2,norm:59},{t:3048.0,norm:53},
  {t:3065.1,norm:49},{t:3081.6,norm:44},{t:3098.3,norm:41},{t:3114.3,norm:37},
  {t:3131.0,norm:34},{t:3146.6,norm:31},{t:3162.5,norm:29},{t:3175.6,norm:27},
  {t:3192.1,norm:24},{t:3214.3,norm:22},{t:3230.2,norm:20},{t:3246.2,norm:19},
  {t:3262.9,norm:17},{t:3277.8,norm:15},{t:3297.7,norm:15},{t:3313.0,norm:13},
  {t:3329.3,norm:12},{t:3346.1,norm:12},{t:3362.4,norm:11},{t:3381.6,norm:9},
  {t:3397.5,norm:9},{t:3415.8,norm:8},{t:3431.5,norm:8},{t:3447.3,norm:7},
  {t:3462.8,norm:7},{t:3479.6,norm:7},{t:3496.5,norm:6},{t:3513.2,norm:6},
  {t:3531.4,norm:5},
];

// Trace 3: short tap, already correct (1 slide)
const trace3 = [
  {t:2334.0,norm:1},{t:2352.4,norm:7},{t:2368.4,norm:11},{t:2385.6,norm:16},
  {t:2404.1,norm:12},{t:2419.1,norm:10},{t:2435.8,norm:6},{t:2452.4,norm:3},
  {t:2469.2,norm:3},{t:2485.8,norm:1},
];

// Trace 4: deliberate swipe, was 2-slide with decay-ratio v1
const trace4 = [
  {t:4505.8,norm:1},{t:4506.5,norm:9},{t:4522.2,norm:82},{t:4545.2,norm:152},
  {t:4553.4,norm:138},{t:4560.9,norm:170},{t:4577.3,norm:181},{t:4594.5,norm:179},
  {t:4610.2,norm:173},{t:4628.7,norm:167},{t:4646.3,norm:158},{t:4661.3,norm:161},
  {t:4677.7,norm:151},{t:4694.6,norm:139},{t:4711.2,norm:128},{t:4729.7,norm:119},
  {t:4745.1,norm:108},{t:4761.5,norm:100},{t:4777.8,norm:92},{t:4795.4,norm:84},
  {t:4811.1,norm:77},{t:4830.1,norm:70},{t:4844.5,norm:63},{t:4865.1,norm:57},
  {t:4878.2,norm:53},{t:4897.5,norm:48},{t:4913.5,norm:44},{t:4928.0,norm:39},
  {t:4945.2,norm:36},{t:4961.6,norm:34},{t:4977.6,norm:31},{t:4994.5,norm:29},
  {t:5011.1,norm:26},{t:5030.3,norm:24},{t:5044.7,norm:22},{t:5061.3,norm:20},
  {t:5077.9,norm:19},{t:5095.0,norm:17},{t:5111.5,norm:15},{t:5127.7,norm:15},
  {t:5146.8,norm:13},{t:5161.8,norm:12},{t:5177.9,norm:12},{t:5194.8,norm:11},
  {t:5211.7,norm:9},{t:5228.2,norm:9},{t:5247.7,norm:8},{t:5265.7,norm:8},
  {t:5280.2,norm:7},{t:5294.9,norm:7},{t:5311.4,norm:7},{t:5328.4,norm:6},
  {t:5344.1,norm:6},{t:5363.1,norm:5},{t:5377.2,norm:5},{t:5393.6,norm:5},
  {t:5411.1,norm:5},{t:5427.6,norm:4},{t:5443.6,norm:4},{t:5464.3,norm:4},
  {t:5477.3,norm:3},{t:5494.6,norm:3},{t:5510.3,norm:3},{t:5527.9,norm:3},
  {t:5544.5,norm:2},{t:5563.1,norm:2},{t:5581.6,norm:2},{t:5593.8,norm:2},
  {t:5612.1,norm:2},{t:5628.5,norm:2},{t:5644.0,norm:2},{t:5661.3,norm:1},
  {t:5678.4,norm:1},{t:5693.7,norm:1},{t:5727.4,norm:1},{t:5744.9,norm:1},
  {t:5778.3,norm:1},
];

const r1 = replay('Trace 1 (medium swipe, was 2-slide bug)', trace1);
const r2 = replay('Trace 2 (hard swipe, was 3-slide bug)', trace2);
const r3 = replay('Trace 3 (short tap, already correct)', trace3);
const r4 = replay('Trace 4 (deliberate swipe, decay-v1 2-slide bug)', trace4);

const allPass = r1 === 1 && r2 === 1 && r3 === 1 && r4 === 1;
console.log(`\nAll pass: ${allPass}`);
if (!allPass) {
  console.error('FAIL — do not proceed with live wiring');
  process.exit(1);
}
