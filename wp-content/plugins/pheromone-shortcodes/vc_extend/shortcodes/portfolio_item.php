<?php
/*PORTFOLIO  ITEM*/
add_shortcode('vc_portfolio_item', 'vc_portfolio_item_f');
function vc_portfolio_item_f( $atts, $content = null)
{
	extract(shortcode_atts(
		array(
			'id' => '',
			'height' => '',
		), $atts)
	);
	$post = get_post($id);
	$image = wp_get_attachment_image_src( get_post_thumbnail_id( $id ), 'wall-portfolio-15'); 
	$title = $post->post_title;
	$catt = get_the_terms( $id, 'portfolio-category' );
	if (isset($catt) && ($catt!='')){
		$slugg = '';
		$slug = ''; 
		foreach($catt  as $vallue=>$key){
			$slugg .= strtolower($key->slug) . " ";
			$slug  .= ''.$key->name.', ';
		}
		
	};
	
	
	$output ='<div class="portfolio-item with-bottom">';
		$output .='<div>';
			$output .='<img src="'.$image[0].'" alt="">';
		$output .='</div>';
		        $output .='<a href="'.get_the_permalink($id).'" class="portfolio-overlay">';
		            $output .='<div class="caption">';
					$output .='<h5>'.$title.'</h5>';
					$output .='<span>'.get_the_excerpt($id).'</span>';
		            $output .='</div>';
		        $output .='</a>';
    $output .='</div>';


	return $output;
};

vc_map( array(
	"name" => __("Portfolio Item",'pheromone'),
	"base" => "vc_portfolio_item",
	"category" => __('Pheromone','pheromone'),
	"params" => array(
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "id",
			"heading" => __("Portfolio Item", "pheromone"),
			"value" => '',
			"description" => __( "Portfolio ID", 'pheromone' )
		),
	)
) );