<?php
/**
 * Front Page Template
 * Renders the homepage with a theme-controlled hero carousel + Gutenberg content below.
 * Keep this minimal so the layout is controlled by blocks.
 */

get_header();

// Hero (Bootstrap carousel)
get_template_part('template-parts/home-hero-carousel');

// Page content (Gutenberg)
if ( have_posts() ) :
  while ( have_posts() ) : the_post();
    the_content();
  endwhile;
endif;

get_footer();