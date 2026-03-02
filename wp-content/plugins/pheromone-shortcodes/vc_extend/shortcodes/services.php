<?php 
/*Services*/
add_shortcode('pheromone_services', 'pheromone_services_f');
function pheromone_services_f( $atts, $content = null)
{

	extract(shortcode_atts(
		array(
			'type_cont' => 'Icon',
			'pheromone_icons' => 'ion-ios-analytics-outline',
			'pheromone_image' => null,
			'pheromone_name' => 'Analytics',
			'pheromone_text' => 'Lorem ipsum dolor sit amet. Con eleifend sem sed dictum mattis sectetur elit. Nulla convallis pul.',
			'link' => '#',
			'white' => null,
			'wow' => null,
			'wow_delay' => '0.1',
			'wow_animate' => 'fadeIn',
			"css" => null
		), $atts)
	);

	if ($wow) $wow = 'wow';
	if ($white) $white = 'white';

    $image = wp_get_attachment_image_src($pheromone_image, true);
    $image = $image[0];


	$output ='<div class="'. esc_attr($wow) .' '. esc_attr($wow_animate) .'" data-wow-delay="'. esc_attr($wow_delay) .'s">
				<div class="hi-icon-effect '. esc_attr($white) .'">';
					if($type_cont =="Icon"){
						$output .='<div class="hi-icon"><i class="'. esc_attr($pheromone_icons) .'"></i></div>';
					} else {
						$output .='<div class="hi-icon image"><img src="'. esc_url($image) .'" alt=""></div>';
					};
	$output .='<div class="service-name">'. esc_attr($pheromone_name) .'</div>
	              	<!--<div class="service-text ">'. esc_attr($pheromone_text) .'</div>-->
	            </div>
            </div>';

	return $output;
};

vc_map( array(
	"name" => __("Services Style #1",'pheromone'),
	"base" => "pheromone_services",    
	"category" => __('Pheromone','pheromone'),
	"params" => array(
		array(
			"type" => "dropdown",
			"admin_label" => true,
			"heading" => __("Type", 'pheromone'),
			"param_name" => "type_cont",
	        'value' => array(
	            __( 'Icon', 'pheromone' ) => 'icon',
	            __( 'Image', 'pheromone' ) => 'image',
	        ),
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_icons",
			"heading" => __("Icon", 'pheromone'),
			"value" => 'ion-ios-analytics-outline',
			'description' => __( 'Select icon from <a href="https://dankov-themes.com/icon/universal/" target="_blank">here</a> or <a href="https://fontawesome.com/v4.7.0/icons/" target="_blank">here</a>', 'pheromone' ),
    		"dependency" => array(
        		"element" => "type_cont",
        		"value" => "icon"
    		),
		),
	    array(
			"type" => "attach_image",
			"admin_label" => true,
			"param_name" => "pheromone_image",
			"heading" => __("Image", 'pheromone'),
			"value" => '',
    		"dependency" => array(
        		"element" => "type_cont",
        		"value" => "image"
    		),
	    ),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "link",
			"heading" => __("Link", 'pheromone'),
			"value" => '#',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_name",
			"heading" => __("Title", 'pheromone'),
			"value" => 'Analytics',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_text",
			"heading" => __("Description", 'pheromone'),
			"value" => 'Lorem ipsum dolor sit amet. Con eleifend sem sed dictum mattis sectetur elit. Nulla convallis pul.',
		),
		array(
			"type" => "checkbox",
			"admin_label" => true,
			"heading" => __("White color", 'pheromone'),
			"param_name" => "white",
			"value" => array("Yes" => true),
            "group" => __("Settings", 'pheromone'),
		),
		array(
			"type" => "checkbox",
			"heading" => __("Animate", 'pheromone'),
			"param_name" => "wow",
			"value" => array("Yes" => true),
            "group" => __("Settings", 'pheromone'),
		),
		array(
			"type" => "textfield",
			"heading" => __("Delay", 'pheromone'),
			"param_name" => "wow_delay",
			"value" => '100',
			"description" => 'in s',
            "group" => __("Settings", 'pheromone'),
    		"dependency" => array(
        		"element" => "wow",
        		"value" => "1"
    		),
		),
	    array(
	        'type' => 'dropdown',
	        'heading' => __( 'Animate', 'pheromone' ),
	        'param_name' => 'wow_animate',
	        'value' => array(
	            __( 'fadeIn', 'pheromone' ) => 'fadeIn',
	            __( 'slideInUp', 'pheromone' ) => 'slideInUp',
	        ),
			'std' => 'fadeIn',
            "group" => __("Settings", 'pheromone'),
    		"dependency" => array(
        		"element" => "wow",
        		"value" => "1"
    		),
	    ),
	)
) 
);