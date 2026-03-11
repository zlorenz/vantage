<?php
/**
 * Archive (date, author, etc.) – same layout as blog index: card list + sidebar, infinite scroll.
 */

get_header();

get_template_part(
	'template-parts/blog/archive-shell',
	null,
	array(
		'archive_title'        => get_the_archive_title(),
		'archive_description'  => get_the_archive_description(),
		'empty_message'        => __( 'No posts found.', 'vantagepictures' ),
		'sentinel_extra_attrs' => array(),
	)
);

get_footer();
