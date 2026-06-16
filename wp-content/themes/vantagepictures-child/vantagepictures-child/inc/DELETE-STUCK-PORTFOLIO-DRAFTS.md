# Delete Stuck Portfolio Draft Posts (Database Guide)

This guide walks you through safely removing the four stuck portfolio drafts that cannot be deleted via the WordPress admin. **Do not run any DELETE queries until you have confirmed the post IDs below.**

---

## How to use in phpMyAdmin

**Copy only the SQL.** When you copy from this document, do **not** include the markdown code-fence lines (the lines that say ` ```sql ` or ` ``` `). Those are for formatting only; phpMyAdmin will treat them as part of the query and you will get a syntax error.

- Select from the first line of the query (e.g. `SELECT` or `DELETE`) through the last line (e.g. `ORDER BY ID;`).
- Paste only that into the phpMyAdmin SQL box.

---

## Post IDs from your screenshot

From the Portfolio → Drafts list, the four posts to remove are:

| ID   | Last modified   |
|------|-----------------|
| 3308 | 2025/02/17 2:33 pm |
| 3306 | 2025/02/17 2:33 pm |
| 3295 | 2025/01/20 12:29 pm |
| 3237 | 2024/06/17 2:03 pm |

**Confirm these are the four IDs you want to delete before proceeding.** If any ID is different, replace `3308, 3306, 3295, 3237` in the queries below with your actual IDs.

---

## Step 0: Find your table prefix (if you get "table doesn't exist")

If you see **#1146 - Table '...wp_posts' doesn't exist**, your site uses a different **table prefix** than `wp_`. You must use the same database and prefix as the WordPress site that has the stuck drafts.

**Option A – From WordPress:** In the same environment (e.g. hosting), open `wp-config.php` and find the line like `$table_prefix = 'wp_';`. The value in quotes (e.g. `wp_`, `wp_2_`, `wpxx_`) is your prefix. Use it in place of `wp_` in all queries below.

**Option B – From the database:** In phpMyAdmin, select the **correct** WordPress database (the one the site uses), open the **SQL** tab, and run:

```sql
SHOW TABLES LIKE '%posts';
```

You should see one table whose name ends with `_posts`, e.g. `wp_posts` or `wp_2_posts`. The part before `_posts` is your table prefix. Use that prefix in every query (e.g. replace `wp_posts` with `wp_2_posts`, `wp_postmeta` with `wp_2_postmeta`, and so on).

**Database name:** Your local `wp-config.php` uses database `vantage_local`. If you are running queries in a database named something else (e.g. `dbilat1u47qlig`), that is a different environment—use the database and table prefix that match the WordPress install where the stuck drafts appear.

---

## Step 1: Identify and confirm the posts in the database

In phpMyAdmin (or your SQL tool):

1. Select your WordPress database (the one used by the site with the stuck drafts).
2. Open the **SQL** tab.
3. Run this **SELECT** (read-only) query. **Replace `wp_` with your table prefix if it is different.** **Copy only the 5 lines of SQL below—do not copy the \`\`\`sql or \`\`\` lines.**

```sql
SELECT ID, post_title, post_name, post_type, post_status, post_date, post_modified
FROM wp_posts
WHERE ID IN (3308, 3306, 3295, 3237)
ORDER BY ID;
```

**What to check:**

- All four rows should show `post_type = 'portfolio'` and `post_status = 'draft'`.
- If any ID is missing or the data doesn’t match (e.g. different post type), **stop** and correct the ID list before running any DELETE.

**If your table prefix is not `wp_`**, replace `wp_posts` (and in later steps `wp_postmeta`, `wp_term_relationships`, `wp_posts` again) with your prefix, e.g. `myprefix_posts`.

---

## Step 2: Check related data (optional but recommended)

These queries only **read** data. They show how many related rows exist so you know what will be removed. For each block below, copy only the SQL lines (not the \`\`\`sql or \`\`\`).

**Meta entries (e.g. ACF, Yoast):**

```sql
SELECT post_id, meta_key, meta_value
FROM wp_postmeta
WHERE post_id IN (3308, 3306, 3295, 3237)
ORDER BY post_id, meta_key;
```

**Taxonomy links (video-format, industry, market):**

```sql
SELECT tr.object_id, tr.term_taxonomy_id, tt.taxonomy, t.name
FROM wp_term_relationships tr
JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
JOIN wp_terms t ON tt.term_id = t.term_id
WHERE tr.object_id IN (3308, 3306, 3295, 3237)
ORDER BY tr.object_id, tt.taxonomy;
```

**Revisions of these posts:**

```sql
SELECT ID, post_parent, post_title, post_type, post_status, post_modified
FROM wp_posts
WHERE post_type = 'revision'
  AND post_parent IN (3308, 3306, 3295, 3237)
ORDER BY post_parent, ID;
```

Once you’re satisfied these are the right posts and related data, proceed to deletion.

---

## Step 3: Order of operations for deletion

To keep the database consistent and avoid orphaned rows or foreign-key issues, delete in this order:

1. **Term relationships** – links between posts and taxonomy terms (`wp_term_relationships`).
2. **Post meta** – custom fields and plugin data (`wp_postmeta`).
3. **Revisions** – revision posts whose `post_parent` is one of the four IDs (`wp_posts` where `post_type = 'revision'`).
4. **Main posts** – the four portfolio rows in `wp_posts`.

We do **not** delete from `wp_terms` or `wp_term_taxonomy`; we only remove the relationship rows in `wp_term_relationships`.

---

## Step 4: Run the DELETE queries

Run each of the following in order. Replace the ID list if you’re using different IDs.

### Queries for prefix **lcb_** (run in order; copy only the SQL)

**4.1 Term relationships**
```sql
DELETE FROM lcb_term_relationships
WHERE object_id IN (3308, 3306, 3295, 3237);
```

**4.2 Post meta**
```sql
DELETE FROM lcb_postmeta
WHERE post_id IN (3308, 3306, 3295, 3237);
```

**4.3 Revisions**
```sql
DELETE FROM lcb_posts
WHERE post_type = 'revision'
  AND post_parent IN (3308, 3306, 3295, 3237);
```

**4.4 The four portfolio posts**
```sql
DELETE FROM lcb_posts
WHERE ID IN (3308, 3306, 3295, 3237)
  AND post_type = 'portfolio'
  AND post_status = 'draft';
```

---

### 4.1 Remove taxonomy relationships (generic wp_ prefix)

(Copy only the SQL below, not the code-fence lines.)

```sql
DELETE FROM wp_term_relationships
WHERE object_id IN (3308, 3306, 3295, 3237);
```

### 4.2 Remove post meta

```sql
DELETE FROM wp_postmeta
WHERE post_id IN (3308, 3306, 3295, 3237);
```

### 4.3 Remove revisions of these posts

```sql
DELETE FROM wp_posts
WHERE post_type = 'revision'
  AND post_parent IN (3308, 3306, 3295, 3237);
```

### 4.4 Remove the four portfolio posts

```sql
DELETE FROM wp_posts
WHERE ID IN (3308, 3306, 3295, 3237)
  AND post_type = 'portfolio'
  AND post_status = 'draft';
```

The `post_type` and `post_status` conditions are a safety check so you don’t delete the wrong rows if an ID is reused.

---

## Step 5: Verify

1. In phpMyAdmin, run the Step 1 SELECT again. It should return **no rows**.
2. In WordPress admin, go to **Portfolio → Drafts**. The four stuck drafts should no longer appear.

---

## Optional: Term counts

After deleting posts, some taxonomy term counts in `wp_term_taxonomy` may be off until WordPress recalculates them. If you use term counts in queries or display and notice wrong numbers, you can recalculate in WordPress via **Tools → Site Health** or a plugin that “recounts terms.” Fixing term counts with raw SQL is possible but more involved; for most cases the above steps are enough.

---

## Backup

Before running any DELETE:

- Back up your database (e.g. phpMyAdmin **Export** or your host’s backup tool).
- If possible, run the DELETE queries on a staging copy first.

---

## Summary checklist

- [ ] Confirmed the four post IDs (3308, 3306, 3295, 3237).
- [ ] Ran Step 1 SELECT and verified all four are `portfolio` / `draft`.
- [ ] (Optional) Ran Step 2 SELECTs to review related data.
- [ ] Backed up the database.
- [ ] Ran the four DELETE queries in order (term_relationships → postmeta → revisions → posts).
- [ ] Ran the Step 1 SELECT again and confirmed zero rows.
- [ ] Checked Portfolio → Drafts in WP admin.
