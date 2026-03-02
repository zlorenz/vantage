<?php
if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly	 		 		 		 		 		 	
add_action( 'wp_ajax_silconfolio_ajax_request', 'silconfolio_ajax_request' );
add_action( 'wp_ajax_nopriv_silconfolio_ajax_request', 'silconfolio_ajax_request' );

function silconfolio_ajax_request() {
wp_reset_postdata();
global $post;
$result['new_posts'] ='';
if ($_GET['st_sf_tag'] =="All"){
$args = array(
		'post_type' => 'portfolio',
		'posts_per_page' => $_GET['st_sf_load_post_count'],
		'offset' => $_GET['st_sf_modal']
);}else{
$e_tag = $_GET['st_sf_tag'];
$p_tag = get_term_by('name', $e_tag, 'portfolio-tags');

	$args = array(
		'post_type' => 'portfolio',
		'posts_per_page' => $_GET['st_sf_load_post_count'],
		'offset' => $_GET['st_sf_modal'],
		'tax_query' => array(
			array(
				'taxonomy' => 'portfolio-tags',
				'terms'    => $p_tag->term_id,
			),
		),
);
	}
	$the_query = new WP_Query( $args );
	if ( $the_query->have_posts() ) {
	while ( $the_query->have_posts() ) {
		$the_query->the_post();
			$catt = get_the_terms( $post->ID, 'portfolio-category' );
			$slugg = '';
			$slug = ''; 
			foreach($catt  as $vallue=>$key){
				$slugg .= strtolower($key->slug) . " ";
				$slug  .= ''.$key->name.', ';
			}
			
		
		
		$large_image_url = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), '');
   	$portfolio_layout = $_GET['st_sf_layout_mode'];
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
		$result['new_posts'] .='<div class="st_sf_strange_portfolio_item st_sf_port_style_ii '.$col.' '.$slugg.'">';
		    $result['new_posts'] .='<div class="portfolio-item">';
				$result['new_posts'] .='<div style="background:url('.$large_image_url[0].')"></div>';
					$result['new_posts'] .='<a href="'.get_the_permalink($post->ID).'"  class="portfolio-overlay">';
						$result['new_posts'] .='<div class="caption">';
							$result['new_posts'] .='<h5>'.get_the_title($post->ID).'</h5>';
							$result['new_posts'] .='<span>'.get_the_excerpt($post->ID).'</span>';
						$result['new_posts'] .='</div>';
					$result['new_posts'] .='</a>';
			$result['new_posts'] .='</div>';
        $result['new_posts'] .='</div>';


		}
	}
$result['count_new_posts'] = $_GET['st_sf_post_count'] + $_GET['st_sf_load_post_count'];
$result['loading'] = __("Load More", "pheromone");
$result['all_loaded'] = __("The End", "pheromone");

wp_reset_postdata();
print json_encode($result);
die();
}
?>