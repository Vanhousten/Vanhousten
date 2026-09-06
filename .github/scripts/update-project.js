const fs = require('fs');

const username = process.env.GH_USERNAME;
const token = process.env.GH_TOKEN;

async function main() {
  const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': username,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    console.error('GitHub API error:', res.status, await res.text());
    process.exit(1);
  }

  const repos = await res.json();

  const filtered = repos
    .filter((r) => !r.fork && r.name.toLowerCase() !== username.toLowerCase())
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, 4);

  const rows = filtered.map((r) => {
    const desc = r.description
      ? r.description.replace(/\|/g, '\\|')
      : 'A selected project from this GitHub profile.';
    const lang = r.language || 'N/A';
    return `<tr><td width="32%"><b><a href="${r.html_url}">${r.name}</a></b></td><td>${desc}<br/><sub>${lang} · ${r.stargazers_count} stars</sub></td></tr>`;
  });

  const table = `<table>\n${rows.join('\n')}\n</table>`;

  const readmePath = 'README.md';
  const readme = fs.readFileSync(readmePath, 'utf8');
  const start = '<!-- PROJECTS:START -->';
  const end = '<!-- PROJECTS:END -->';
  const startIdx = readme.indexOf(start);
  const endIdx = readme.indexOf(end);

  if (startIdx === -1 || endIdx === -1) {
    console.error('Markers <!-- PROJECTS:START --> / <!-- PROJECTS:END --> not found in README.md');
    process.exit(1);
  }

  const updated =
    readme.slice(0, startIdx + start.length) + '\n' + table + '\n' + readme.slice(endIdx);

  fs.writeFileSync(readmePath, updated);
  console.log(`Updated with ${filtered.length} projects.`);
}

main();
