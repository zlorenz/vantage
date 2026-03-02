<?php 
/*Contacts Us*/
add_shortcode('pheromone_contacts_us', 'pheromone_contacts_us_f');
function pheromone_contacts_us_f( $atts, $content = null)
{

	extract(shortcode_atts(
		array(
			'pheromone_contacts_us_text' => 'Feel free to contact us. A business has to be involving, it has to be fun, and it has to exercise your creative instincts. Start where you are. Use what you have. Do what you can. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
			'pheromone_contacts_us_address' => '1234 Some Avenue, New York, NY 56789',
			'pheromone_contacts_us_email' => 'info@youwebsite.com',
			'pheromone_contacts_us_phone' => '(123) 456-7890',
			"css" => null
		), $atts)
	);

	if ($pheromone_contacts_us_text!=false){ $output ='<p>'. esc_attr($pheromone_contacts_us_text) .'</p><hr>';};
	if ($pheromone_contacts_us_address!=false){	$output .='<h5><i class="fa fa-map-marker fa-fw fa-lg"></i> '. esc_attr($pheromone_contacts_us_address) .'</h5>';};
	if ($pheromone_contacts_us_email!=false){	$output .='<h5><i class="fa fa-envelope fa-fw fa-lg"></i> <a href="mailto:'. esc_attr($pheromone_contacts_us_email) .'">'. esc_attr($pheromone_contacts_us_email) .'</a></h5>';};
	if ($pheromone_contacts_us_phone!=false){	$output .='<h5><i class="fa fa-phone fa-fw fa-lg"></i> <a href="tel:'. esc_attr($pheromone_contacts_us_phone) .'">'. esc_attr($pheromone_contacts_us_phone) .'</a></h5>';};
              return $output;

};


/*Contacts Us*/
vc_map( array(
	"name" => __("Contacts Us",'pheromone'),
	"base" => "pheromone_contacts_us",
	"category" => __('Pheromone','pheromone'),
	"params" => array(
		array(
			"type" => "textarea",
			"admin_label" => true,
			"param_name" => "pheromone_contacts_us_text",
			"heading" => __("Text", 'pheromone'),
			"value" => 'Feel free to contact us. A business has to be involving, it has to be fun, and it has to exercise your creative instincts. Start where you are. Use what you have. Do what you can. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_contacts_us_address",
			"heading" => __("Address", 'pheromone'),
			"value" => '1234 Some Avenue, New York, NY 56789',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_contacts_us_email",
			"heading" => __("E-mail", 'pheromone'),
			"value" => 'info@youwebsite.com',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_contacts_us_phone",
			"heading" => __("Phone", 'pheromone'),
			"value" => '(123) 456-7890',
		),
	)
) );