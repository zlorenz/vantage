# ACF: About page founders (schema)

Repeater on the **About** page used for founder Person schema (name, job title, image, bio, sameAs links). The schema code in `yoast-schema-about-founders.php` reads this repeater when present; otherwise it uses built-in defaults.

## 1. New field group

- **WP Admin** → **ACF** → **Field Groups** → **Add New**
- **Title:** About page – Founders (schema)
- **Location:**  
  - **Page** → **is equal to** → **About**  
  (or: **Page Type** → **is equal to** → **Front Page** if About is your front page — otherwise use Page = About)

## 2. Repeater field

- **Add Field**
- **Field Label:** Founders (for schema)
- **Field Name:** `vp_founders`
- **Field Type:** Repeater
- **Sub fields:** add the following (order matters only for the editor).

| Field Label   | Field Name   | Field Type | Notes |
|---------------|--------------|------------|--------|
| Name          | `name`       | Text       | Required. Full name. |
| Job Title     | `job_title`  | Text       | e.g. Managing Director |
| Image         | `image`      | Image      | **Return Value:** Image ID |
| Bio           | `bio`        | Textarea   | Optional. Short bio for schema `description`. |
| Same As (URLs)| `same_as`    | Repeater   | Optional. Social/profile links (LinkedIn, etc.). |

## 3. Same As sub-repeater

For **Same As (URLs)** (the nested repeater):

- **Sub fields:** one field only  
  - **Field Label:** URL  
  - **Field Name:** `url`  
  - **Field Type:** URL  

So each “row” of the outer repeater can have multiple `same_as` links (one URL per row in the inner repeater).

## 4. Repeater settings (optional)

- **Minimum:** 0 (or 4 if you always want four founders)
- **Maximum:** leave blank or set to 4
- **Layout:** Block or Row, as you prefer

## 5. Save and fill

- **Save** the field group.
- Edit the **About** page; you should see **Founders (for schema)**.
- Add one row per founder. Fill **Name**, **Job Title**, and **Image** (existing headshots). Optionally add **Bio** and **Same As** URLs (e.g. LinkedIn). The schema will use this data; if you leave the repeater empty, the built-in four founders are still used.

## Field names reference (for code)

- Repeater: `vp_founders`
- Sub fields: `name`, `job_title`, `image` (ID), `bio`, `same_as` (repeater with `url`)
