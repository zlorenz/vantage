<?php
/**
 * The template for displaying Comments.
 * Child theme: wrapped in col-lg-6 for responsive width.
 */

if ( post_password_required() ) {
	return;
}
?>
<div class="row">
	<div class="col-12 col-lg-6">
		<div id="comments">
			<?php
			if ( comments_open() && ! have_comments() ) :
			?>
				<h2 id="comments-title" class="comments-title">
					<?php esc_html_e( 'No Comments yet!', 'vantagepictures' ); ?>
				</h2>
			<?php
			endif;

			if ( have_comments() ) :
			?>
				<h2 id="comments-title" class="comments-title">
					<?php
					$comments_number = get_comments_number();
					if ( '1' === $comments_number ) {
						printf( _x( 'One Reply to &ldquo;%s&rdquo;', 'comments title', 'vantagepictures' ), get_the_title() );
					} else {
						printf(
							/* translators: 1: number of comments, 2: post title */
							_nx(
								'%1$s Reply to &ldquo;%2$s&rdquo;',
								'%1$s Replies to &ldquo;%2$s&rdquo;',
								$comments_number,
								'comments title',
								'vantagepictures'
							),
							number_format_i18n( $comments_number ),
							get_the_title()
						);
					}
					?>
				</h2>
				<?php
				if ( get_comment_pages_count() > 1 && get_option( 'page_comments' ) ) :
				?>
				<nav id="comment-nav-above">
					<h1 class="assistive-text"><?php esc_html_e( 'Comment navigation', 'vantagepictures' ); ?></h1>
					<div class="nav-previous"><?php previous_comments_link( __( '&larr; Older Comments', 'vantagepictures' ) ); ?></div>
					<div class="nav-next"><?php next_comments_link( __( 'Newer Comments &rarr;', 'vantagepictures' ) ); ?></div>
				</nav>
				<?php
				endif;
				?>
				<ol class="comment-list commentlist">
					<?php wp_list_comments( array( 'callback' => 'vantagepictures_comment' ) ); ?>
				</ol>
				<?php
				if ( get_comment_pages_count() > 1 && get_option( 'page_comments' ) ) :
				?>
				<nav id="comment-nav-below">
					<h1 class="assistive-text"><?php esc_html_e( 'Comment navigation', 'vantagepictures' ); ?></h1>
					<div class="nav-previous"><?php previous_comments_link( __( '&larr; Older Comments', 'vantagepictures' ) ); ?></div>
					<div class="nav-next"><?php next_comments_link( __( 'Newer Comments &rarr;', 'vantagepictures' ) ); ?></div>
				</nav>
				<?php
				endif;

			elseif ( ! comments_open() && ! is_page() && post_type_supports( get_post_type(), 'comments' ) ) :
			?>
				<h2 id="comments-title" class="comments-title nocomments"><?php esc_html_e( 'Comments are closed.', 'vantagepictures' ); ?></h2>
			<?php
			endif;

			comment_form();
			?>
		</div><!-- /#comments -->
	</div><!-- /.col-12.col-lg-6 -->
</div><!-- /.row -->
