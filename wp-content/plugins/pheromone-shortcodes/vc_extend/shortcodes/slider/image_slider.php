<?php
add_shortcode('vc_image_slider', 'vc_image_slider_f');
function vc_image_slider_f( $atts, $content = null)
{
	extract(shortcode_atts(
		array(
			'type_cont' => 'Image',
			'slider_image' => null,
			'slider_icon' => 'fa fa-barcode',
			'slider_icon_size' => '80px',
			'slider_icon_line_height' => '120px',
		), $atts)
	);

    $image = wp_get_attachment_image_src($slider_image, true);
    $image = $image[0];

    if($type_cont =="Image"){
		$output ='<p><img src="'. esc_url($image) .'" alt=""></p>';
	} else {
		$output ='<i class="'. esc_attr($slider_icon) .'" style="font-size: '. esc_attr($slider_icon_size) .'; line-height: '. esc_attr($slider_icon_line_height) .';"></i>';
	};
	return $output;
};

vc_map( array(
	"name" => __("Image/Icon Item",'pheromone'),
	"base" => "vc_image_slider",
    "content_element" => true,
    "as_child" => array('only' => 'pheromone_hero_image, pheromone_hero_video, pheromone_hero_kenburns'), // Use only|except attributes to limit parent (separate multiple values with comma)
	"category" => __('Headers','pheromone'),
	"params" => array(
		array(
			"type" => "dropdown",
			"admin_label" => true,
			"heading" => __("Type", 'pheromone'),
			"param_name" => "type_cont",
	        'value' => array(
	            __( 'Image', 'pheromone' ) => 'image',
	            __( 'Icon', 'pheromone' ) => 'icon',
	        ),
		),
		array(
			"type" => "attach_image",
			"admin_label" => true,
			"param_name" => "slider_image",
			"heading" => __("Image", 'pheromone'),
    		"dependency" => array(
        		"element" => "type_cont",
        		"value" => "image"
    		),
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "slider_icon",
			"heading" => __("Icon", 'pheromone'),
			"value" => 'fa fa-barcode',
			'description' => __( 'Select icon from <a href="https://dankov-themes.com/icon/universal/index.html" target="_blank">here</a> or <a href="https://fontawesome.io/icons/" target="_blank">here</a>', 'pheromone' ),
    		"dependency" => array(
        		"element" => "type_cont",
        		"value" => "icon"
    		),
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "slider_icon_size",
			"heading" => __("Icon Size in px", 'pheromone'),
			"value" => '80px',
    		"dependency" => array(
        		"element" => "type_cont",
        		"value" => "icon"
    		),
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "slider_icon_line_height",
			"heading" => __("Line Height in px", 'pheromone'),
			"value" => '120px',
    		"dependency" => array(
        		"element" => "type_cont",
        		"value" => "icon"
    		),
		),	
	)
) );