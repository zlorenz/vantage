# VP Lark Client Brief

Sends **Video Campaign Brief** (Gravity Forms ID 1) submissions to a Lark group chat via custom bot webhook.

## Requirements

- WordPress with Gravity Forms
- Form ID 1 = Video Campaign Brief
- Lark custom bot webhook (with optional signature/secret)

## Configuration

Add these constants to `wp-config.php` (above the "That's all" line):

```php
/**
 * VP Lark Client Brief – Lark custom bot webhook
 * Required for sending Video Campaign Brief submissions to Lark.
 */
define( 'VP_LARK_WEBHOOK_URL', 'https://open.larksuite.com/open-apis/bot/v2/hook/YOUR-WEBHOOK-ID' );

/**
 * Optional. If your Lark bot uses "signature" security mode, add the secret.
 * The plugin will sign outgoing requests (timestamp + sign in JSON body).
 */
define( 'VP_LARK_WEBHOOK_SECRET', 'your-secret-key' );
```

### Local / dev

Use the same constants. For local testing, use a test webhook URL or a staging Lark group. Keep secrets out of version control (use `.env` or local-only `wp-config.php` overrides if needed).

### Production

- Use your production Lark webhook URL
- Set `VP_LARK_WEBHOOK_SECRET` if the bot has signature verification enabled
- Do not commit secrets to Git

## Behavior

- **Hook**: `gform_after_submission_1`
- **Spam**: Entries with status `spam` are skipped; nothing is sent to Lark
- **Empty fields**: Skipped in the message
- **File uploads**: Output as URLs in an "Uploaded Files" section (no binary attachments)
- **Admin link**: A direct Gravity Forms entry URL is included at the end

## Testing

1. Add the constants to `wp-config.php`
2. Activate the plugin: **Plugins → VP Lark Client Brief → Activate**
3. Submit the Video Campaign Brief form on `/video-campaign-brief/`
4. Check the Lark group chat for the new message
5. If it fails, enable `WP_DEBUG` and `WP_DEBUG_LOG` and check `wp-content/debug.log` for details

## Upgrading to Lark cards

The code is structured so the field extraction layer (`VP_Lark_Helpers::extract_field_data`) can be reused. To switch to a Lark card payload:

1. Add a new method in `VP_Lark_Sender` (e.g. `send_card()`) that builds the Lark card JSON
2. Update `VP_Lark_Handler::handle_submission` to call `send_card()` instead of `send_text()`
3. The same extracted data can feed the card structure

## File structure

```
vp-lark-client-brief/
├── vp-lark-client-brief.php     # Plugin bootstrap
├── README.md
└── includes/
    ├── class-vp-lark-config.php   # Reads wp-config constants
    ├── class-vp-lark-helpers.php  # GF entry → readable data
    ├── class-vp-lark-sender.php   # Webhook POST + optional signature
    └── class-vp-lark-handler.php  # gform_after_submission_1 hook
```
