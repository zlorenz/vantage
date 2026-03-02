<?php 
/*MailChimp*/
add_shortcode('pheromone_mailchimp', 'pheromone_mailchimp_f');
function pheromone_mailchimp_f( $atts, $content = null)
{

	extract(shortcode_atts(
		array(
			'pheromone_mailchimp_text' => 'Sign-Up For News Updates and Alerts',
			'pheromone_mailchimp_action' => 'https://forbetterweb.us11.list-manage.com/subscribe/post?u=4f751a6c58b225179404715f0&amp;id=18fc72763a',
			'pheromone_mailchimp_placeholder' => 'Email address...',
			'pheromone_mailchimp_text_button' => 'Subscribe',
			'pheromone_mailchimp_button' => 'btn-dark',
			'center' => null,
			"css" => null
		), $atts)
	);
	
	if ($center) $center = 'center';

	$output ='<div class="mailchimp-block '. esc_attr($center) .'">
            <h5>'. esc_attr($pheromone_mailchimp_text) .'</h5>
            <form id="mc-embedded-subscribe-form" action="'. esc_url($pheromone_mailchimp_action) .'" method="post" name="mc-embedded-subscribe-form" target="_blank" novalidate="" class="form-inline subscribe-form">
              <div class="input-group input-group-lg">
                <input id="mce-EMAIL" type="email" name="EMAIL" placeholder="'. esc_attr($pheromone_mailchimp_placeholder) .'" class="form-control"><span class="input-group-btn">
                  <button id="mc-embedded-subscribe" type="submit" name="subscribe" class="btn '. esc_attr($pheromone_mailchimp_button) .'">'. esc_attr($pheromone_mailchimp_text_button) .'</button></span>
                <div id="mce-responses"></div>
                <div id="mce-error-response" style="display:none" class="response"></div>
                <div id="mce-success-response" style="display:none" class="response"></div>
              </div>
            </form>
         <img src="'. get_template_directory_uri().'/assets/images/mailchimp.png' .'" alt="">
         </div>';
	return $output;


};



/*MailChimp*/
vc_map( array(
	"name" => __("MailChimp",'pheromone'),
	"base" => "pheromone_mailchimp",
	"category" => __('Pheromone','pheromone'),
	"params" => array(	
		array(
			"type" => "textarea",
			"admin_label" => true,
			"param_name" => "pheromone_mailchimp_text",
			"heading" => __("Welcome Text", 'pheromone'),
			"value" => 'Sign-Up For News Updates and Alerts',
		),	
		array(
			"type" => "textarea",
			"admin_label" => true,
			"param_name" => "pheromone_mailchimp_action",
			"heading" => __("Welcome text", 'pheromone'),
			"value" => 'https://forbetterweb.us11.list-manage.com/subscribe/post?u=4f751a6c58b225179404715f0&amp;id=18fc72763a',
		),
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_mailchimp_placeholder",
			"heading" => __("Placeholder Text", 'pheromone'),
			"value" => 'Email address...',
		),	
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_mailchimp_text_button",
			"heading" => __("Button Text", 'pheromone'),
			"value" => 'Subscribe',
		),	
		array(
			"type" => "dropdown",
			"admin_label" => true,
			"heading" => __("Button Color", 'pheromone'),
			"param_name" => "pheromone_mailchimp_button",
	        'value' => array(
	            __( 'Black', 'pheromone' ) => 'btn-dark',
	            __( 'Pink', 'pheromone' ) => 'btn-violet',
	            __( 'Gray', 'pheromone' ) => 'btn-pheromone',
	        ),
	        'std' => 'btn-dark',
		),	
        array(
			"type" => "checkbox",
			"admin_label" => true,
			"heading" => __("Text Center", 'pheromone'),
			"param_name" => "center",
			"value" => array("Yes" => true),
		),	
	)
) );