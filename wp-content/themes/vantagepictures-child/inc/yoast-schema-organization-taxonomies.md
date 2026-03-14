# Organization schema: taxonomies as specialties / areas served

## Schema.org research

**Organization** ([schema.org/Organization](https://schema.org/Organization)) has no property named "specialties" or "services provided". The best fits for portfolio taxonomies are:

| Property       | Type        | Description |
|----------------|-------------|-------------|
| **areaServed** | Text, Place, AdministrativeArea | "The geographic area where a service or offered item is provided." |
| **knowsAbout** | Text, Thing, URL | "Of a Person, and less typically of an **Organization**, to indicate a topic that is known about - suggesting possible expertise but not implying it." |

**Recommendation:**

1. **areaServed** – Use for **market** taxonomy (China, Singapore, USA, etc.). These are geographic/regional markets where Vantage provides production. Schema allows `Text`; we use an array of term names.
2. **knowsAbout** – Use for **industry** (tech, finance, automotive) and **video-format** (brand film, product video, branded documentary). These are topics/expertise areas. Combined into one array of strings.

**Where it applies:** The Organization node is output by Yoast on every page (same graph site-wide). We augment that single Organization node so the data appears wherever the graph is used (homepage, about, work, portfolio, etc.). No single "most appropriate page" — the Organization is global.

## Implementation

- New file: `inc/yoast-schema-organization-taxonomies.php`
- Filter: `wpseo_schema_graph`, priority 12 (after founders at 11)
- Logic: Find the graph piece with `@type` Organization and `@id` = `{site_url}#organization`; add `areaServed` (market term names) and `knowsAbout` (industry + video-format term names)
- Data: `get_terms( [ 'taxonomy' => [ 'market', 'industry', 'video-format' ], 'hide_empty' => false ] )` — use all terms so the Organization reflects full capabilities; optionally set `hide_empty => true` to only list terms that have portfolio items.
