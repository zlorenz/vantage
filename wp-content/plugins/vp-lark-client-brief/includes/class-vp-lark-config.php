<?php
/**
 * Configuration loader for VP Lark Client Brief.
 * Reads webhook URL and secret from wp-config.php constants.
 *
 * @package VP_Lark_Client_Brief
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Loads and exposes Lark webhook configuration.
 * Uses VP_LARK_WEBHOOK_URL and VP_LARK_WEBHOOK_SECRET if defined in wp-config.php.
 */
class VP_Lark_Config {

	/**
	 * Cached webhook URL.
	 *
	 * @var string|null
	 */
	private static $webhook_url = null;

	/**
	 * Cached webhook secret.
	 *
	 * @var string|null
	 */
	private static $secret = null;

	/**
	 * Whether config has been loaded.
	 *
	 * @var bool
	 */
	private static $loaded = false;

	/**
	 * Load configuration from wp-config constants.
	 */
	private static function load() {
		if ( self::$loaded ) {
			return;
		}
		self::$webhook_url = defined( 'VP_LARK_WEBHOOK_URL' ) ? VP_LARK_WEBHOOK_URL : null;
		self::$secret      = defined( 'VP_LARK_WEBHOOK_SECRET' ) ? VP_LARK_WEBHOOK_SECRET : null;
		self::$loaded      = true;
	}

	/**
	 * Returns the webhook URL if configured.
	 *
	 * @return string|null
	 */
	public static function get_webhook_url() {
		self::load();
		return self::$webhook_url ? trim( (string) self::$webhook_url ) : null;
	}

	/**
	 * Returns the webhook secret if configured.
	 *
	 * @return string|null
	 */
	public static function get_secret() {
		self::load();
		return self::$secret ? trim( (string) self::$secret ) : null;
	}

	/**
	 * Whether the plugin is properly configured.
	 *
	 * @return bool
	 */
	public static function is_configured() {
		$url = self::get_webhook_url();
		return ! empty( $url ) && filter_var( $url, FILTER_VALIDATE_URL );
	}
}
