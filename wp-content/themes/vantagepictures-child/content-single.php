<?php
/**
 * Template for displaying content in the single post template.
 * Child theme: no featured image in entry-content; entry-meta uses date-only, no author (see functions.php).
 */
?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
	<header class="entry-header">
		<h1 class="entry-title"><?php the_title(); ?></h1>
		<?php
		if ( 'post' === get_post_type() ) {
			?>
			<div class="entry-meta">
			<?php vp_single_posted_on(); ?>
			<?php
			$categories = get_the_category();
			if ( ! empty( $categories ) ) {
				echo ' <span class="entry-meta__sep" aria-hidden="true">·</span> ';
				foreach ( $categories as $cat ) {
					printf(
						'<a href="%1$s" class="vp-category-pill">%2$s</a> ',
						esc_url( get_category_link( $cat ) ),
						esc_html( vp_category_display_name( $cat ) )
					);
				}
			}
			?>
			</div><!-- /.entry-meta -->
			<?php
		}
		?>
	</header><!-- /.entry-header -->
	<div class="entry-content">
		<?php
		// Child theme: featured image removed from entry-content.
		the_content();

		wp_link_pages(
			array(
				'before' => '<div class="page-link"><span>' . esc_html__( 'Pages:', 'vantagepictures' ) . '</span>',
				'after'  => '</div>',
			)
		);
		?>
	</div><!-- /.entry-content -->

	<?php
		edit_post_link( __( 'Edit', 'vantagepictures' ), '<span class="edit-link">', '</span>' );
	?>

	<footer class="entry-meta">
		<hr>
		<?php
			$categories = get_the_category();
			if ( ! empty( $categories ) ) {
				$links = array();
				foreach ( $categories as $cat ) {
					$links[] = sprintf(
						'<a href="%1$s" rel="category tag">%2$s</a>',
						esc_url( get_category_link( $cat ) ),
						esc_html( vp_category_display_name( $cat ) )
					);
				}
				$category_list = implode( __( ', ', 'vantagepictures' ), $links );
				printf( __( 'This entry was posted in %1$s.', 'vantagepictures' ), $category_list );
			} else {
				esc_html_e( 'This entry was posted.', 'vantagepictures' );
			}
			?>
	</footer><!-- /.entry-meta -->
</article><!-- /#post-<?php the_ID(); ?> -->
