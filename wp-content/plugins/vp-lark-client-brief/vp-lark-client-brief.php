<?php
/**
 * Plugin Name: VP Lark Client Brief
 * Description: Sends Video Campaign Brief form submissions to Lark group chat via custom bot webhook.
 * Version: 1.0.0
 * Author: Vantage Pictures
 *
 * @package VP_Lark_Client_Brief
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main plugin loader. Bootstraps the Lark integration after Gravity Forms is available.
 * Requires Gravity Forms to be active.
 */
add_action( 'gform_loaded', function () {
	require_once __DIR__ . '/includes/class-vp-lark-config.php';
	require_once __DIR__ . '/includes/class-vp-lark-helpers.php';
	require_once __DIR__ . '/includes/class-vp-lark-discovery.php';
	require_once __DIR__ . '/includes/class-vp-lark-mapper.php';
	require_once __DIR__ . '/includes/class-vp-lark-presentation.php';
	require_once __DIR__ . '/includes/class-vp-lark-sender.php';
	require_once __DIR__ . '/includes/class-vp-lark-handler.php';

	VP_Lark_Handler::init();
}, 5 );
