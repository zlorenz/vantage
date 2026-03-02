<?php
/*PORTFOLIO  ITEM #2*/
add_shortcode('vc_portfolio_item_2', 'vc_portfolio_item_2_f');
function vc_portfolio_item_2_f( $atts, $content = null)
{
	extract(shortcode_atts(
		array(
			'id' => '',
			'height' => '320px',
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
	
	$output ='<div class="portfolio-item" style="height:'.$height.';">';
		$output .='<div style="background:url('.$image[0].')"></div>';
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
	"name" => __("Portfolio Item #2",'pheromone'),
	"base" => "vc_portfolio_item_2",
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
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "height",
			"heading" => __("Size", "pheromone"),
			"value" => '320px',
			"description" => __( "Picture height in px. for example: 300px", 'pheromone' )
		)
	)
) );
