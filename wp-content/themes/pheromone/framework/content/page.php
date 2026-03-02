<div class="wrap-content">
	<?php while ( have_posts() ) : the_post(); ?>
		<?php the_content(); ?>
		<?php $defaults = array( 'link_before' => '<span>',	'link_after'  => '</span>','before'   => '<div class="pheromone_pg_single" >',	'after' => '</div>',); wp_link_pages( $defaults );?>
		<?php
			if ( comments_open() || get_comments_number() ) {
				comments_template();
			}
		?>
		<?php endwhile; // end of the loop. ?>
</div>