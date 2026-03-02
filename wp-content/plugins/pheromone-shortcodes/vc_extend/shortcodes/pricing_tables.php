<?php 
/*Pricing Tables*/
add_shortcode('pheromone_pricing_tables', 'pheromone_pricing_tables_f');
function pheromone_pricing_tables_f( $atts, $content = null)
{

	extract(shortcode_atts(
		array(
			'pheromone_pricing_tables_name' => 'Free',
			'pheromone_pricing_tables_price' => '7',
			'pheromone_pricing_tables_currency' => '$',
			'pheromone_pricing_tables_date' => 'day',
			'pheromone_pricing_tables_desc1' => '24/7 Tech Support',
			'pheromone_pricing_tables_desc2' => '80 GB Storage',
			'pheromone_pricing_tables_desc3' => '1 GB Bandwidth',
			'pheromone_pricing_tables_desc4' => '100 GB Storage',
			'pheromone_pricing_tables_button_a' => 'https://google.com/',
			'pheromone_pricing_tables_button' => 'Get Started',
			'best' => null,
			"css" => null
		), $atts)
	);
	
	if ($best) $best = 'best';

	$output ='<div class="pricing_tables_wrap '. esc_attr($best) .'">
                	<div class="pricing_tables_name">'. esc_attr($pheromone_pricing_tables_name) .'</div>
                	<div class="pricing_tables_price"><span>'. esc_attr($pheromone_pricing_tables_currency) .'</span>'. esc_attr($pheromone_pricing_tables_price) .'<i>/ '. esc_attr($pheromone_pricing_tables_date) .'</i></div>
                	<div class="pricing_tables_desc">
                		<ul>
                			<li>'. esc_attr($pheromone_pricing_tables_desc1) .'</li>
                			<li>'. esc_attr($pheromone_pricing_tables_desc2) .'</li>
                			<li>'. esc_attr($pheromone_pricing_tables_desc3) .'</li>
                			<li>'. esc_attr($pheromone_pricing_tables_desc4) .'</li>
                		</ul>
                	</div>
                	<div class="pricing_tables_buttons"><a href="'. esc_url($pheromone_pricing_tables_button_a) .'">'. esc_attr($pheromone_pricing_tables_button) .'</a></div>
              </div>';
	return $output;


};

/*Pricing Tables*/
vc_map( array(
	"name" => __("Pricing Tables",'pheromone'),
	"base" => "pheromone_pricing_tables",
	"category" => __('Pheromone','pheromone'),
	"params" => array(
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_pricing_tables_name",
			"heading" => __("Name", 'pheromone'),
			"value" => 'Free',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_pricing_tables_price",
			"heading" => __("Price", 'pheromone'),
			"value" => '7',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_pricing_tables_currency",
			"heading" => __("Сurrency", 'pheromone'),
			"value" => '$',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_pricing_tables_date",
			"heading" => __("Time", 'pheromone'),
			"value" => 'Day',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_pricing_tables_desc1",
			"heading" => __("Value 1", 'pheromone'),
			"value" => '24/7 Tech Support',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_pricing_tables_desc2",
			"heading" => __("Value 2", 'pheromone'),
			"value" => '80 GB Storage',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_pricing_tables_desc3",
			"heading" => __("Value 3", 'pheromone'),
			"value" => '1 GB Bandwidth',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_pricing_tables_desc4",
			"heading" => __("Value 4", 'pheromone'),
			"value" => '100 GB Storage',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_pricing_tables_button_a",
			"heading" => __("Button Link", 'pheromone'),
			"value" => 'https://google.com/',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_pricing_tables_button",
			"heading" => __("Button", 'pheromone'),
			"value" => 'Get Started',
		),
        array(
			"type" => "checkbox",
			"admin_label" => true,
			"heading" => __("Best Options", 'pheromone'),
			"param_name" => "best",
			"value" => array("Yes" => true),
		),	
	)
) );