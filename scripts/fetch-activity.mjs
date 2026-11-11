// Builds activity.json for the Activity section: daily GitHub contributions
// and LeetCode submissions for the last year, plus LeetCode solved counts.
//
//   node scripts/fetch-activity.mjs [output path]   (default: dist/activity.json)
//
// Runs in .github/workflows/activity.yml, which publishes the file to the
// `data` branch. If one source fails, its last published data is kept, so a
// LeetCode or GitHub outage never blanks the calendar.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const GITHUB_USER = "Tusharcode007";
const LEETCODE_USER = "Z2N2oTuz4h";
const PREVIOUS_URL = "https://raw.githubusercontent.com/Tusharcode007/rstushar_portfolio/data/activity.json";
const OUT = process.argv[2] || "dist/activity.json";
const WINDOW_DAYS = 371; // 53 weeks, enough to fill the calendar

const UA = "Mozilla/5.0 (compatible; rstushar-portfolio-activity/1.0)";
const now = new Date();
const since = new Date(now.getTime() - WINDOW_DAYS * 864e5).toISOString().slice(0, 10);

// Keep only days inside the window that had activity
function trim(days) {
  return Object.fromEntries(
    Object.entries(days)
      .filter(([date, count]) => date >= since && count > 0)
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

async function request(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { "User-Agent": UA, ...options.headers } });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res;
}

/* ---------- GitHub ---------- */

// Official GraphQL API; needs a token (GITHUB_TOKEN in Actions)
async function githubFromGraphQL(token) {
  const query = `query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
      }
    }
  }`;
  const res = await request("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { login: GITHUB_USER } }),
  });
  const body = await res.json();
  if (body.errors) throw new Error(`GitHub GraphQL: ${body.errors.map((e) => e.message).join("; ")}`);
  const days = {};
  for (const week of body.data.user.contributionsCollection.contributionCalendar.weeks) {
    for (const day of week.contributionDays) days[day.date] = day.contributionCount;
  }
  return days;
}

// The public calendar the profile page renders; used without a token or if GraphQL fails
async function githubFromProfile() {
  const html = await (await request(`https://github.com/users/${GITHUB_USER}/contributions`)).text();
  const dateById = new Map();
  for (const [, tag] of html.matchAll(/<td\b([^>]*ContributionCalendar-day[^>]*)>/g)) {
    const date = tag.match(/data-date="(\d{4}-\d{2}-\d{2})"/);
    const id = tag.match(/id="([^"]+)"/);
    if (date && id) dateById.set(id[1], date[1]);
  }
  const days = {};
  for (const [, id, text] of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const date = dateById.get(id);
    if (!date) continue;
    const count = text.match(/^(\d[\d,]*) contribution/);
    days[date] = count ? Number(count[1].replace(/,/g, "")) : 0;
  }
  if (dateById.size < 300) throw new Error(`GitHub profile calendar: only ${dateById.size} days found`);
  return days;
}

async function fetchGitHub() {
  let days;
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    try {
      days = await githubFromGraphQL(token);
    } catch (err) {
      console.warn(`GitHub GraphQL failed, using the profile calendar: ${err.message}`);
    }
  }
  days ??= await githubFromProfile();
  return { username: GITHUB_USER, url: `https://github.com/${GITHUB_USER}`, updatedAt: now.toISOString(), days: trim(days) };
}

/* ---------- LeetCode ---------- */

async function leetcode(query, variables) {
  const res = await request("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors) throw new Error(`LeetCode: ${body.errors.map((e) => e.message).join("; ")}`);
  return body.data;
}

async function fetchLeetCode() {
  const stats = await leetcode(
    `query($u: String!) { matchedUser(username: $u) { submitStatsGlobal { acSubmissionNum { difficulty count } } } }`,
    { u: LEETCODE_USER }
  );
  const solved = {};
  for (const { difficulty, count } of stats.matchedUser.submitStatsGlobal.acSubmissionNum) {
    solved[difficulty.toLowerCase()] = count;
  }

  // The calendar API works per calendar year; the window spans two
  const days = {};
  for (const year of new Set([Number(since.slice(0, 4)), now.getUTCFullYear()])) {
    const data = await leetcode(
      `query($u: String!, $y: Int) { matchedUser(username: $u) { userCalendar(year: $y) { submissionCalendar } } }`,
      { u: LEETCODE_USER, y: year }
    );
    // Keys are Unix timestamps (seconds) of UTC midnight
    for (const [ts, count] of Object.entries(JSON.parse(data.matchedUser.userCalendar.submissionCalendar))) {
      const date = new Date(Number(ts) * 1000).toISOString().slice(0, 10);
      days[date] = (days[date] || 0) + count;
    }
  }
  return {
    username: LEETCODE_USER,
    url: `https://leetcode.com/u/${LEETCODE_USER}/`,
    updatedAt: now.toISOString(),
    solved,
    days: trim(days),
  };
}

/* ---------- Build ---------- */

async function previous() {
  try {
    return await (await request(PREVIOUS_URL, { cache: "no-store" })).json();
  } catch {
    return {};
  }
}

const [github, leetcodeData, last] = await Promise.allSettled([fetchGitHub(), fetchLeetCode(), previous()]);
const prior = last.value || {};
const result = { generatedAt: now.toISOString(), github: null, leetcode: null };

for (const [key, outcome] of [["github", github], ["leetcode", leetcodeData]]) {
  if (outcome.status === "fulfilled") {
    result[key] = outcome.value;
  } else {
    console.warn(`${key} failed: ${outcome.reason?.message || outcome.reason}`);
    if (prior[key]) {
      console.warn(`${key}: keeping data from ${prior[key].updatedAt}`);
      result[key] = prior[key];
    }
  }
}

if (!result.github && !result.leetcode) {
  console.error("No activity data from either source");
  process.exit(1);
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(result) + "\n");
const sum = (d) => Object.values(d?.days || {}).reduce((a, b) => a + b, 0);
console.log(`Wrote ${OUT}: GitHub ${sum(result.github)} contributions, LeetCode ${sum(result.leetcode)} submissions`);
