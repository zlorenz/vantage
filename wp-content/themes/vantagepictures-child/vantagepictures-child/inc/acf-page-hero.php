<?php
/**
 * ACF: Page hero header visibility.
 * Registers a checkbox on the default Page edit screen to show or hide the hero header block.
 * When unchecked, the default page template shows a condensed header (no background image).
 *
 * @package vantagepictures-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'acf/init', 'vp_register_acf_page_hero_field_group' );

/**
 * Registers the "Page hero" ACF field group for the Page post type.
 */
function vp_register_acf_page_hero_field_group() {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	acf_add_local_field_group(
		array(
			'key'                   => 'group_vp_page_hero',
			'title'                 => 'Page header',
			'fields'                => array(
				array(
					'key'           => 'field_vp_show_hero_header',
					'label'         => 'Show hero header',
					'name'          => 'vp_show_hero_header',
					'type'          => 'true_false',
					'instructions'  => 'When on, the page uses a full-width hero header with the featured image as background (e.g. About). When off, the header is condensed with no background image (e.g. portfolio taxonomy style).',
					'default_value' => 1,
					'ui'            => 1,
					'ui_on_text'    => 'Yes',
					'ui_off_text'   => 'No',
				),
			),
			'location'              => array(
				array(
					array(
						'param'    => 'post_type',
						'operator' => '==',
						'value'    => 'page',
					),
				),
			),
			'menu_order'            => 0,
			'position'              => 'side',
			'style'                 => 'default',
			'label_placement'       => 'top',
			'instruction_placement' => 'label',
			'active'                => true,
		)
	);
}
