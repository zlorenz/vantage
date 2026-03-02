<?php
add_shortcode('vc_image_item', 'vc_image_item_f');
function vc_image_item_f( $atts, $content = null)
{
	extract(shortcode_atts(
		array(
			'logo' => '',
			'link' => '#',
		), $atts)
	);

	$image_done = wp_get_attachment_image($logo, 'img-responsive logos');


	$output =''.$image_done.'';
	return $output;
};

vc_map( array(
	"name" => __("Image",'pheromone'),
	"base" => "vc_image_item",
	"category" => __('Pheromone','pheromone'),
	"params" => array(
		array(
			"type" => "attach_image",
			"param_name" => "logo",
			"heading" => __("Clients", 'pheromone'),
			"admin_label" => true,
			"description" => __( "Select image", 'pheromone' )
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "link",
			"heading" => __("Link", 'pheromone'),
			"value" => '#',
		),
        )
	) 
);