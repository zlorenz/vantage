<?php
/**
 * Gravity Forms submission handler for Video Campaign Brief (Form ID 1).
 * Orchestrates discovery → mapping → presentation, sends card to Lark webhook.
 *
 * @package VP_Lark_Client_Brief
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Hooks into gform_after_submission_1 and sends formatted brief to Lark as interactive card.
 */
class VP_Lark_Handler {

	const FORM_ID = 1;

	public static function init() {
		add_action( 'gform_after_submission_' . self::FORM_ID, array( __CLASS__, 'handle_submission' ), 10, 2 );
	}

	public static function handle_submission( $entry, $form ) {
		if ( ! is_array( $entry ) || empty( $form ) ) {
			return;
		}

		$status = isset( $entry['status'] ) ? $entry['status'] : '';
		if ( $status === 'spam' ) {
			return;
		}

		if ( ! VP_Lark_Config::is_configured() ) {
			return;
		}

		// 1. Field discovery layer.
		$discovered = VP_Lark_Discovery::discover( $form, $entry );

		// 2. Mapping layer.
		$mapped = VP_Lark_Mapper::map_to_brief( $discovered );

		// 3. Presentation layer.
		$entry_id = isset( $entry['id'] ) ? (int) $entry['id'] : 0;
		$form_id  = isset( $form['id'] ) ? (int) $form['id'] : self::FORM_ID;
		$card     = VP_Lark_Presentation::build_card( $mapped, $entry_id, $form_id );

		if ( empty( $card ) ) {
			return;
		}

		$result = VP_Lark_Sender::send_card( $card );

		// Debug: log when WP_DEBUG is enabled.
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			self::log_debug( $discovered, $mapped, $card, $result );
		}
	}

	/**
	 * Logs discovery, mapped data, card payload, and webhook response when WP_DEBUG_LOG is on.
	 */
	private static function log_debug( $discovered, $mapped, $card, $result ) {
		if ( ! defined( 'WP_DEBUG_LOG' ) || ! WP_DEBUG_LOG ) {
			return;
		}
		$prefix = 'VP Lark Brief: ';
		error_log( $prefix . 'Discovered fields: ' . wp_json_encode( $discovered, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT ) );
		error_log( $prefix . 'Mapped brief: ' . wp_json_encode( $mapped, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT ) );
		error_log( $prefix . 'Card payload: ' . wp_json_encode( $card, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT ) );
		if ( is_array( $result ) ) {
			$msg = 'Webhook response: success=' . ( ! empty( $result['success'] ) ? 'true' : 'false' ) . ', code=' . ( $result['code'] ?? 'N/A' );
			if ( ! empty( $result['message'] ) ) {
				$msg .= ', message=' . $result['message'];
			}
			error_log( $prefix . $msg );
		}
	}
}
