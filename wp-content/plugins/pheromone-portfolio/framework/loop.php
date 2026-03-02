<?php
	if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly 
	$e_tag = get_post_meta($post->ID, 'st_sf_tag', 1);
	$p_tag = "";
	if  ($e_tag !='All'){ $p_tag = get_term_by('name', $e_tag, 'portfolio-tags');};
	$paged = get_query_var('paged') ? get_query_var('paged') : 1;
	if($p_tag !=''){
	$args = array(
		'post_type' 		=> 'portfolio',
		'posts_per_page' 	=> get_post_meta($post->ID, 'port-count', true),
		'post_status' 		=> 'publish',
		'orderby' 			=> 'date',
		'order' 			=> 'DESC',
		'paged' 			=> $paged,
		'tax_query' => array(
			array(
				'taxonomy' => 'portfolio-tags',
				'terms'    => $p_tag->term_id,
			),
		),
	);
	}else{
		$args = array(
			'post_type' 		=> 'portfolio',
			'posts_per_page' 	=> get_post_meta($post->ID, 'port-count', true),
			'post_status' 		=> 'publish',
			'orderby' 			=> 'date',
			'order' 			=> 'DESC',
			'paged' 			=> $paged,
		);
	}
	
	$wp_query = new WP_Query($args);
	$portfolio_layout = get_post_meta($post->ID, 'port_layout', 1);

	if ( have_posts() ) : while ( have_posts() ) : the_post(); 
		$catt = get_the_terms( $post->ID, 'portfolio-category' );
		if (isset($catt) && ($catt!='')){
			$slugg = '';
			$slug = ''; 
			foreach($catt  as $vallue=>$key){
				$slugg .= strtolower($key->slug) . " ";
				$slug  .= ''.$key->name.', ';
			}
			
		};
	
    $large_image_url = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'full');
	$portfolio_item_width = get_post_meta($post->ID, 'st_sf_th', 1);
	
	if ($portfolio_item_width == 'portfolio-squre'){ $col='st_sf_col col-md-4 st_sf_x1'; };
	if ($portfolio_item_width == 'portfolio-squrex2'){ $col='st_sf_col col-md-6 st_sf_x2'; };
	if ($portfolio_item_width == 'portfolio-wide'){ $col='st_sf_col col-md-6 st_sf_x1'; };
	if ($portfolio_item_width == 'portfolio-long'){ $col='st_sf_col col-md-4 st_sf_x2'; };
	if($portfolio_layout == '3 Columns Without Spaces'){
 		$col='st_sf_col col-md-4 st_sf_x1'; 
	}
	elseif($portfolio_layout == '3 Columns With Spaces'){
		$col='col-md-4 st_sf_x1';
	}
	elseif($portfolio_layout == '4 Columns Without Spaces'){
		$col='st_sf_col col-md-3 st_sf_x1';
	}
	elseif($portfolio_layout == '4 Columns With Spaces'){
		$col='col-md-3 st_sf_x1';

	}
	elseif($portfolio_layout == '2 Columns With Spaces'){
		$col='col-md-6 st_sf_x1'; 
	
	}
	elseif($portfolio_layout == '2 Columns Without Spaces'){
		$col='st_sf_col col-md-6 st_sf_x1';
	}
	?>
    <div class="st_sf_strange_portfolio_item st_sf_port_style_ii <?php echo esc_attr($col);?> <?php echo esc_attr($slugg)?>">
    	<div class="portfolio-item">
			<div style="background:url('<?php echo esc_url($large_image_url[0]); ?>')"></div>
			<a href="<?php the_permalink($post->ID)?>" class="portfolio-overlay">
				<div class="caption">
					<h5><?php the_title();?></h5>
					<span><?php the_excerpt($post->ID)?></span>
				</div>
			</a>
		</div>
    </div>
<?php endwhile; endif; ?>