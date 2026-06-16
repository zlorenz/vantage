<?php
/**
 * Internal crew filter taxonomies (indexed from ACF; not for manual editorial use).
 * Taxonomies: client, director, dop, art-director
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'init',
	function () {
		$taxes = array(
			'client'       => __( 'Client (index)', 'vantagepictures' ),
			'director'     => __( 'Director (index)', 'vantagepictures' ),
			'dop'          => __( 'DOP (index)', 'vantagepictures' ),
			'art-director' => __( 'Art Director (index)', 'vantagepictures' ),
		);

		foreach ( $taxes as $slug => $label ) {
			register_taxonomy(
				$slug,
				array( 'portfolio' ),
				array(
					'labels'              => array(
						'name'          => $label,
						'singular_name' => $label,
					),
					'public'              => false,
					'publicly_queryable'  => false,
					'show_ui'             => false,
					'show_in_menu'        => false,
					'show_in_nav_menus'   => false,
					'show_in_rest'        => false,
					'hierarchical'        => false,
					'rewrite'             => false,
					'query_var'           => false,
				)
			);
		}
	},
	5
);
