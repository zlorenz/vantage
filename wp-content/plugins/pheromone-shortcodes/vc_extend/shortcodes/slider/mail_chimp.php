<?php 
/*MailChimp*/
add_shortcode('vc_mailchimp_slider', 'vc_mailchimp_slider_f');
function vc_mailchimp_slider_f( $atts, $content = null)
{
	extract(shortcode_atts(
		array(
			'pheromone_slider_mailchimp_action' => 'http://forbetterweb.us11.list-manage.com/subscribe/post?u=4f751a6c58b225179404715f0&amp;id=18fc72763a',
			'pheromone_slider_mailchimp_text' => 'GET NOTIFIED!',
			'pheromone_slider_mailchimp_placeholder' => 'Email address...',
			'pheromone_slider_mailchimp_button' => 'btn-violet',
			"css" => null
		), $atts)
	);
	
	$output ='<form id="mc-embedded-subscribe-form2" action="'. esc_url($pheromone_slider_mailchimp_action) .'" method="post" name="mc-embedded-subscribe-form" target="_blank" novalidate="" class="small-form subscribe-form">
                <div class="input-group input-group-lg">
                  <input id="mce-EMAIL2" type="email" name="EMAIL" placeholder="'. esc_attr($pheromone_slider_mailchimp_placeholder) .'" class="form-control"><span class="input-group-btn">
                    <button id="mc-embedded-subscribe2" type="submit" name="subscribe" class="btn btn-violet">'. esc_attr($pheromone_slider_mailchimp_text) .'</button></span>
                </div>
                <div id="mce-responses2">
                  <div id="mce-error-response2" style="display:none" class="response"></div>
                  <div id="mce-success-response2" style="display:none" class="response"></div>
                </div>
              </form>';
	return $output;


};

/*MailChimp*/
vc_map( array(
	"name" => __("MailChimp",'pheromone'),
	"base" => "vc_mailchimp_slider",
    "content_element" => true,
    "as_child" => array('only' => 'pheromone_hero_image, pheromone_hero_video, pheromone_hero_kenburns'),
	"category" => __('Universal','pheromone'),
	"params" => array(
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_slider_mailchimp_action",
			"heading" => __("Action", 'pheromone'),
			"value" => 'http://forbetterweb.us11.list-manage.com/subscribe/post?u=4f751a6c58b225179404715f0&amp;id=18fc72763a',
		),	
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_slider_mailchimp_text",
			"heading" => __("Text Button", 'pheromone'),
			"value" => 'GET NOTIFIED!',
		),	
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_slider_mailchimp_placeholder",
			"heading" => __("Placeholder", 'pheromone'),
			"value" => 'Email address...',
		),			
	)
) );