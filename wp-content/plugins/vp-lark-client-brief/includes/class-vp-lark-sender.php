<?php
/**
 * Sends payloads to Lark custom bot webhook.
 * Supports text and interactive card messages; optional signature verification.
 *
 * @package VP_Lark_Client_Brief
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Lark webhook sender with optional signature.
 */
class VP_Lark_Sender {

	/**
	 * Sends an interactive card to the configured Lark webhook.
	 *
	 * @param array $card Card structure (config, header, elements).
	 * @return array{ success: bool, code: int, body: string, message?: string }
	 */
	public static function send_card( $card ) {
		$url = VP_Lark_Config::get_webhook_url();
		if ( ! $url ) {
			self::log( 'VP Lark: Webhook URL not configured. Add VP_LARK_WEBHOOK_URL to wp-config.php.' );
			return array(
				'success' => false,
				'code'    => 0,
				'body'    => '',
				'message' => 'Webhook URL not configured',
			);
		}

		$payload = array(
			'msg_type' => 'interactive',
			'card'     => $card,
		);

		$secret = VP_Lark_Config::get_secret();
		if ( $secret ) {
			$payload = self::add_signature_to_payload( $payload, $secret );
		}

		$body  = wp_json_encode( $payload );
		$args  = array(
			'body'    => $body,
			'headers' => array(
				'Content-Type' => 'application/json',
			),
			'method'  => 'POST',
			'timeout' => 15,
		);

		$response  = wp_remote_post( $url, $args );
		$code      = (int) wp_remote_retrieve_response_code( $response );
		$resp_body = wp_remote_retrieve_body( $response );

		if ( is_wp_error( $response ) ) {
			self::log( 'VP Lark: Webhook request failed. ' . $response->get_error_message() );
			return array(
				'success' => false,
				'code'    => 0,
				'body'    => $resp_body,
				'message' => $response->get_error_message(),
			);
		}

		if ( $code !== 200 ) {
			self::log( 'VP Lark: Webhook returned non-200. Code: ' . $code . ', body: ' . substr( $resp_body, 0, 500 ) );
		}

		// WP_DEBUG: log webhook response summary.
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG && defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
			$ok = $code >= 200 && $code < 300;
			self::log( 'VP Lark: Webhook response. Code: ' . $code . ', success: ' . ( $ok ? 'yes' : 'no' ) . ', body (first 300 chars): ' . substr( $resp_body, 0, 300 ) );
		}

		return array(
			'success' => $code >= 200 && $code < 300,
			'code'    => $code,
			'body'    => $resp_body,
		);
	}

	/**
	 * Adds Lark custom bot signature to the payload (in-body format).
	 * Feishu/Lark custom bot expects: sign = Base64(HMAC-SHA256(key=timestamp+"\n"+secret, data=""))
	 * with timestamp and sign as top-level fields in the JSON body.
	 *
	 * @param array  $payload Payload with msg_type and content.
	 * @param string $secret  Webhook secret (never logged).
	 * @return array Payload with timestamp and sign added.
	 */
	public static function add_signature_to_payload( $payload, $secret ) {
		$timestamp = (string) time();
		$to_sign   = $timestamp . "\n" . $secret;
		$sign      = base64_encode( hash_hmac( 'sha256', '', $to_sign, true ) );

		$payload['timestamp'] = $timestamp;
		$payload['sign']      = $sign;

		return $payload;
	}

	/**
	 * Logs a message when WP_DEBUG_LOG is enabled.
	 * Never logs secrets.
	 *
	 * @param string $message Message to log.
	 */
	public static function log( $message ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG && defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
			error_log( $message );
		}
	}
}
