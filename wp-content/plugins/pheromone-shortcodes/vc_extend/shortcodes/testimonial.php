<?php
/*TESTIMONIAL  ITEM*/
add_shortcode('vc_testimonial_item', 'vc_testimonial_item_f');
function vc_testimonial_item_f( $atts, $content = null)
{
	extract(shortcode_atts(
		array(
			'id' => '',
			'name' => 'Pheromone Customer',
			'white' => null,
		), $atts)
	);
	if ($white) $white = 'white';

	$post = get_post($id);
	$image = wp_get_attachment_image_src( get_post_thumbnail_id( $id ), 'wall-portfolio-squre'); 
	$title = $post->post_title;
	$content = $post->post_content;
    $output ='<div class="testimonials-item '. esc_attr($white) .'">';
    if ($image[0]!=false)   { $output .='<img src="'.$image[0].'" alt="" class="center-block">';};
      $output .='<div class="testimonials-caption">';
        $output .='<h5>'.$content.'</h5>';
        $output .='<span class="small text-muted">'. esc_attr($name) .'</span>';
        $output .='<h2 class="classic no-pad">'.$title.'</h2>';
      $output .='</div>';
    $output .='</div>';

	return $output;
};


vc_map( array(
	"name" => __("Testimonial Item",'pheromone'),
	"base" => "vc_testimonial_item",
	"category" => __('Pheromone','pheromone'),
	"params" => array(
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "id",
			"heading" => __("Testimonial Item", 'pheromone'),
			"value" => '',
			"description" => __( "Tesimonial ID", 'pheromone' )
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "name",
			"heading" => __("Testimonial Title", 'pheromone'),
			"value" => 'Pheromone Customer',
		),
		array(
    		"type" => "checkbox",
    		"admin_label" => true,
    		"heading" => __("White font", 'pheromone'),
    		"param_name" => "white",
    		"group" => __("Settings", 'pheromone'),
			"value" => array("Yes" => true),
		),
		
	)
) );