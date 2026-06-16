<?php
/**
 * Category archive – same layout as blog index: card list + sidebar, infinite scroll.
 */

get_header();

$category = get_queried_object();

get_template_part(
	'template-parts/blog/archive-shell',
	null,
	array(
		'archive_title'        => esc_html( $category->name ),
		'archive_description'  => ! empty( $category->description ) ? wp_kses_post( wpautop( $category->description ) ) : '',
		'empty_message'        => __( 'No posts in this category yet.', 'vantagepictures' ),
		'sentinel_extra_attrs' => array( 'data-category-id' => (string) $category->term_id ),
	)
);

get_footer();
