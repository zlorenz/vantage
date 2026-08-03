# Sanity package patches

## `sanity-plugin-media+6.0.2.patch`

Locks **rename** and **delete** for exactly one media tag:

- `_id`: `mediaTag-external-upload`
- Display name: `Client Upload (Campaign Brief)`

Only Studio **Admin** (`getStudioRole` → `admin`) may rename or delete this tag. Editors keep full create/rename/delete for every other tag. Translators already cannot open the Media tool (unchanged).

### Why a patch?

`sanity-plugin-media` has no role/permission hooks on tag CRUD. It mutates tags via its own Redux-observable epics and custom Edit Tag dialog (not Sanity document actions / schema `readOnly`). Approach A patches the installed dist bundle.

### Role signal coupling

The patch reads:

```js
document.documentElement.dataset.studioRole === 'admin'
```

That attribute is stamped by `sanity/components/StudioRoleLayout.tsx` (`data-studio-role` values: `admin` | `editor` | `translator`).

**If that attribute name or values change, this patch silently stops enforcing the lock and must be updated to match.**

### What the patch changes

1. **`tagsDeleteEpic` / `tagsUpdateEpic`** — short-circuit with a 403-style epic error for non-admins on the locked tag id.
2. **Tag sidebar action lists** — omit `edit` / `delete` for the locked tag when not admin.
3. **`DialogTagEdit`** — hide Delete, disable Name + Save, and no-op submit/delete handlers when locked for non-admins.

### Maintenance notes

- `sanity-plugin-media` was **archived (2026-06-17)**. This patch will not conflict with upstream releases, and will not get upstream fixes if Sanity core breaks compatibility with 6.0.2.
- Applied via `postinstall`: `patch-package` in `sanity/package.json` (Studio workspace only; root Next.js app does not install this plugin).
- After editing `node_modules/sanity-plugin-media`, regenerate with:

  ```bash
  cd sanity && npx patch-package sanity-plugin-media
  ```
