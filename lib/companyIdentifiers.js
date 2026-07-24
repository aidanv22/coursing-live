import { sql } from './db';

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function randomSuffix(length = 4) {
  return Math.random().toString(36).slice(2, 2 + length);
}

// SMS join keywords need to be short, all-caps, single "word" (carriers and
// customers alike find a keyword easier to type than a full company name).
function keywordFromName(name) {
  const letters = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return (letters.slice(0, 10) || 'JOIN') + Math.floor(100 + Math.random() * 900);
}

async function isSlugTaken(slug) {
  const rows = await sql`SELECT id FROM companies WHERE slug = ${slug}`;
  return rows.length > 0;
}

async function isKeywordTaken(keyword) {
  const rows = await sql`SELECT id FROM companies WHERE join_keyword = ${keyword}`;
  return rows.length > 0;
}

// Call this with any company row you've loaded. If it's missing a slug or
// join_keyword (e.g. an account created before these existed), generates and
// persists them, then returns the updated row. Otherwise returns it as-is.
export async function ensureCompanyIdentifiers(company) {
  if (company.slug && company.join_keyword) return company;

  let slug = company.slug;
  if (!slug) {
    const base = slugify(company.name) || 'company';
    slug = base;
    let attempts = 0;
    while (await isSlugTaken(slug) && attempts < 5) {
      slug = `${base}-${randomSuffix()}`;
      attempts++;
    }
  }

  let joinKeyword = company.join_keyword;
  if (!joinKeyword) {
    joinKeyword = keywordFromName(company.name);
    let attempts = 0;
    while (await isKeywordTaken(joinKeyword) && attempts < 5) {
      joinKeyword = keywordFromName(company.name);
      attempts++;
    }
  }

  const rows = await sql`
    UPDATE companies SET slug = ${slug}, join_keyword = ${joinKeyword}
    WHERE id = ${company.id}
    RETURNING *
  `;

  return rows[0] || { ...company, slug, join_keyword: joinKeyword };
}
