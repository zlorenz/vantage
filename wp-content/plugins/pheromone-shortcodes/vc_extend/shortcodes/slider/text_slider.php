<?php
add_shortcode('vc_text_slider', 'vc_text_slider_f');
function vc_text_slider_f( $atts, $content = null)
{
	extract(shortcode_atts(
		array(
			'text' => 'Pheromone will look beautiful on any device. Pheromone easily and efficiently scales your project with one code base. Serve high-resolution images to devices with retina displays. We have a dedicated support team ready to answer your questions. Feel free to contact us to provide some feedback on our templates or give us suggestions for new themes.',
		), $atts)
	);

    $output ='<p>'.$text.'</p>';

	return $output;
};

vc_map( array(
	"name" => __("Text Item",'pheromone'),
	"base" => "vc_text_slider",
    "content_element" => true,
    "as_child" => array('only' => 'pheromone_hero_image, pheromone_hero_video, pheromone_hero_kenburns'), // Use only|except attributes to limit parent (separate multiple values with comma)
	"category" => __('Headers','pheromone'),
	"params" => array(
		array(
			"type" => "textarea_html",
			"admin_label" => true,
			"param_name" => "text",
			"heading" => __("Text", 'pheromone'),
			"value" => 'Pheromone will look beautiful on any device. Pheromone easily and efficiently scales your project with one code base. Serve high-resolution images to devices with retina displays. We have a dedicated support team ready to answer your questions. Feel free to contact us to provide some feedback on our templates or give us suggestions for new themes.',
		),		
	)
) );