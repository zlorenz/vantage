<?php
/**
 * ACF: Portfolio video fields – Vimeo (default) + Xinpianchang (Chinese pages).
 *
 * Adds xinpianchang_url so editors can optionally set a Xinpianchang embed for
 * Chinese portfolio pages. The theme renders Xinpianchang on /zh/ pages when set,
 * otherwise falls back to Vimeo.
 *
 * @package vantagepictures-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'acf/init', 'vp_register_acf_portfolio_video_field_group' );

/* --- ACF field group: xinpianchang_url for portfolio --- */

/**
 * Registers the "Portfolio video (China)" ACF field group.
 * Contains xinpianchang_url; vimeo_link lives in the main Portfolio field group.
 */
function vp_register_acf_portfolio_video_field_group() {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	acf_add_local_field_group(
		array(
			'key'                   => 'group_vp_portfolio_video_china',
			'title'                 => 'Portfolio Video (China)',
			'fields'                => array(
				array(
					'key'           => 'field_vp_xinpianchang_url',
					'label'         => 'Xinpianchang URL',
					'name'          => 'xinpianchang_url',
					'type'          => 'url',
					'instructions'  => 'Paste the embed URL from Xinpianchang\'s share dialog (e.g. https://player.xinpianchang.com/?aid=11955262&mid=...). The page URL from the browser will NOT work—you need the full embed URL with both aid and mid. Leave empty to use Vimeo on Chinese pages.',
					'placeholder'   => 'https://player.xinpianchang.com/?aid=...&mid=...',
				),
			),
			'location'              => array(
				array(
					array(
						'param'    => 'post_type',
						'operator' => '==',
						'value'    => 'portfolio',
					),
				),
			),
			'menu_order'            => 5,
			'position'              => 'normal',
			'style'                 => 'default',
			'label_placement'       => 'top',
			'instruction_placement' => 'label',
			'active'                => true,
		)
	);
}
