# Vimeo → GA4 via GTM (Portfolio embeds)

The theme pushes these **dataLayer events** on single-portfolio pages when users interact with Vimeo embeds:

| Event name         | When it fires              | Suggested GA4 event name |
|--------------------|----------------------------|---------------------------|
| `vp_vimeo_play`    | User started playback      | `video_play`              |
| `vp_vimeo_progress`| 25%, 50%, 75%, 100%        | `video_progress`          |
| `vp_vimeo_complete`| Playback ended             | `video_complete`          |

Each push includes `vimeo_video_id` (and `progress_percent` for progress).

## GTM setup (do in this order)

1. **Data Layer Variables** (create these first so you can use them in the tags)  
   In GTM go to **Variables** → **User-Defined Variables** → **New**:
   - **Variable 1:** Type = **Data Layer Variable**. Data Layer Variable Name: `vimeo_video_id`. Name the variable e.g. `DLV - vimeo_video_id`. Save.
   - **Variable 2:** Type = **Data Layer Variable**. Data Layer Variable Name: `progress_percent`. Name the variable e.g. `DLV - progress_percent`. Save.

2. **Triggers**  
   **Triggers** → **New**. Create three **Custom Event** triggers:
   - Event name: `vp_vimeo_play` → trigger name e.g. `CE - Vimeo play` (use “All Custom Events”). Save.
   - Event name: `vp_vimeo_progress` → trigger name e.g. `CE - Vimeo progress`. Save.
   - Event name: `vp_vimeo_complete` → trigger name e.g. `CE - Vimeo complete`. Save.

3. **GA4 Event tags**  
   **Tags** → **New**. For each of the three events, create a **GA4 Event** tag:
   - **video_play:** Event name `video_play`, add parameter `video_id` = variable `{{DLV - vimeo_video_id}}`, trigger = `CE - Vimeo play`.
   - **video_progress:** Event name `video_progress`, parameters `video_id` = `{{DLV - vimeo_video_id}}` and `progress_percent` = `{{DLV - progress_percent}}`, trigger = `CE - Vimeo progress`.
   - **video_complete:** Event name `video_complete`, parameter `video_id` = `{{DLV - vimeo_video_id}}`, trigger = `CE - Vimeo complete`.  
   Use your existing GA4 Configuration tag for each.

4. **Publish** the container, then test on a portfolio page with a Vimeo video (play, seek past 25/50/75%, let it end). Use GA4 DebugView to confirm events.
