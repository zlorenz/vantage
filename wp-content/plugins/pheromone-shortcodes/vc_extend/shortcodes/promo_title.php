<?php 
/*Promo Title*/
add_shortcode('pheromone_promo', 'pheromone_promo_f');
function pheromone_promo_f( $atts, $content = null)
{

	extract(shortcode_atts(
		array(
			'type_cont' => 'H3',
			'pheromone_promo_text' => 'Our Services',
			'pheromone_promo_paragraph' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla convallis pulvinar vestibulum. Doneceleifend, sem sed dictum. Lorem ipsum dolor sit amet, consectetur adipiscing elits',
			'center' => null,
			'white' => null,
			"css" => null
		), $atts)
	);
	
	if ($center) $center = 'center';
	if ($white) $white = 'white';

	$output ='<div class="promo-block '. esc_attr($center) .' '. esc_attr($white) .'">';
				if($type_cont =="H3"){
					$output .='<h3>'. esc_attr($pheromone_promo_text) .'</h3>';
				} else {
					$output .='<h2>'. esc_attr($pheromone_promo_text) .'</h2>';
				};
            	$output .='<p>'. esc_attr($pheromone_promo_paragraph) .'</p>
              </div>';
	return $output;

};

/*Promo Title*/
vc_map( array(
	"name" => __("Promo Title",'pheromone'),
	"base" => "pheromone_promo",
	"category" => __('Pheromone','pheromone'),
	"params" => array(
		array(
			"type" => "dropdown",
			"admin_label" => true,
			"heading" => __("Type", 'pheromone'),
			"param_name" => "type_cont",
	        'value' => array(
	            __( 'H3', 'pheromone' ) => 'h3',
	            __( 'H2', 'pheromone' ) => 'h2',
	        ),
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_promo_text",
			"heading" => __("Title", 'pheromone'),
			"value" => 'Our Services',
		),
		array(
			"type" => "textarea",
			"admin_label" => true,
			"param_name" => "pheromone_promo_paragraph",
			"heading" => __("Paragraph", 'pheromone'),
			"value" => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla convallis pulvinar vestibulum. Doneceleifend, sem sed dictum. Lorem ipsum dolor sit amet, consectetur adipiscing elits',
		),
        array(
			"type" => "checkbox",
			"admin_label" => true,
			"heading" => __("White fonts", 'pheromone'),
			"param_name" => "white",
			"group" => __("Settings", 'pheromone'),
			"value" => array("Yes" => true),
		),	
        array(
			"type" => "checkbox",
			"admin_label" => true,
			"heading" => __("Text Center", 'pheromone'),
			"param_name" => "center",
			"group" => __("Settings", 'pheromone'),
			"value" => array("Yes" => true),
		),	
	)
) );




