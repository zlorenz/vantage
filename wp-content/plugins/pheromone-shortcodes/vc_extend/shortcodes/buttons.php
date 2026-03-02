<?php 
/*Button*/
add_shortcode('pheromone_vc_button', 'pheromone_vc_button_f');
function pheromone_vc_button_f( $atts, $content = null)
{
	
	extract(shortcode_atts(
		array(
			'pheromone_title' => 'Try it now!',
			'pheromone_title_size'=>'16px',
			'pheromone_title_color'=>'#fff',
			'pheromone_bg_color'=>'#5AC8FB',
			'pheromone_url' => '#',
			'pheromone_display' => 'block',
			'pheromone_target'=>'_self',
			'pheromone_padding'=>'7px 15px',
			'pheromone_margin'=>'10px 0 0 0',
			'pheromone_border_w' => '1px',
			'pheromone_border_s' => 'solid',
			'pheromone_border_c' => '#5AC8FB',
			'pheromone_border_r' => '4px',
			'pheromone_title_color_hover'=>'#555',
			'pheromone_bg_color_hover'=>'#fff',
			'pheromone_border_c_hover' => '#555',

		), $atts)
	);
	$content = '';

	$content .='<a class="pheromone_vc_button" data-title-color-hover="'.$pheromone_title_color_hover.'" data-bg-color-hover="'.$pheromone_bg_color_hover.'" data-border-c-hover="'.$pheromone_border_c_hover.'"  href="'.$pheromone_url.'" target="'.$pheromone_target.'" style="display:'.$pheromone_display.'; font-size:'.$pheromone_title_size.'; line-heigth:'.$pheromone_title_size.'; color:'.$pheromone_title_color.'; background-color:'.$pheromone_bg_color.'; padding:'.$pheromone_padding.'; margin:'.$pheromone_margin.'; border-width:'.$pheromone_border_w.'; border-style:'.$pheromone_border_s.'; border-color:'.$pheromone_border_c.'; border-radius:'.$pheromone_border_r.'">'.$pheromone_title.'';

	$content .='</a>';
	return $content;
};


/*Button*/
vc_map( array(
	"name" => __("Button",'pheromone'),
	"base" => "pheromone_vc_button",
	"category" => __('Pheromone','pheromone'),
	"params" => array(
		array(
			"type" => "textfield",
			"param_name" => "pheromone_url",
			"heading" => __("URL", 'pheromone'),
			"value" => '#',
			"admin_label" => true,
			"group" => "General"
		),
		array(
			'type' => 'dropdown',
			'heading' => "Target",
			'param_name' => 'pheromone_target',
			'value' => array( "_blank", "_self" ),
			'std' => '_self',
			"admin_label" => true,
			"group" => "General"
		),
		array(
			'type' => 'dropdown',
			'heading' => "Display",
			'param_name' => 'pheromone_display',
			'value' => array( "block", "inline-block" ),
			'std' => 'block',
			"group" => "General"
		),

		
		array(
			"type" => "textfield",
			"param_name" => "pheromone_padding",
			"heading" => __("Padding", 'pheromone'),
			"value" => '10px 20px',
			"group" => "General"
		),

		
		array(
			"type" => "textfield",
			"param_name" => "pheromone_margin",
			"heading" => __("Margin", 'pheromone'),
			"value" => '0px',
			"group" => "General"
		),

		array(
			"type" => "textfield",
			"param_name" => "pheromone_title",
			"heading" => __("Title", 'pheromone'),
			"value" => 'Button',
			"admin_label" => true,
			"group" => "Title"
		),
		
		array(
			"type" => "textfield",
			"param_name" => "pheromone_title_size",
			"heading" => __("Font Size", 'pheromone'),
			"value" => '16px',
			"group" => "Title"
		),
		array(
			"type" => "colorpicker",
			"param_name" => "pheromone_title_color",
			"heading" => __("Title Color", 'pheromone'),
			"value" => '#fff',
			"group" => "Title"
		),
		array(
			"type" => "colorpicker",
			"param_name" => "pheromone_title_color_hover",
			"heading" => __("Hover Title Color", 'pheromone'),
			"value" => '#fff',
			"group" => "Title"
		),
		
		array(
			"type" => "colorpicker",
			"param_name" => "pheromone_bg_color",
			"heading" => __("Background Color", 'pheromone'),
			"value" => '#000',
			"group" => "Background"
		),
		array(
			"type" => "colorpicker",
			"param_name" => "pheromone_bg_color_hover",
			"heading" => __("HOVER Background Color", 'pheromone'),
			"value" => '#00f6ff',
			"group" => "Background"
		),
		
		array(
			"type" => "textfield",
			"param_name" => "pheromone_border_w",
			"heading" => __("Border Width", 'pheromone'),
			"value" => '1px',
			"group" => "Border"
		),

		array(
			"type" => "colorpicker",
			"param_name" => "pheromone_border_c",
			"heading" => __("Border Color", 'pheromone'),
			"value" => '#000',
			"group" => "Border"
		),
		array(
			"type" => "colorpicker",
			"param_name" => "pheromone_border_c_hover",
			"heading" => __("HOVER Border Color", 'pheromone'),
			"value" => '#00f6ff',
			"group" => "Border"
		),
		array(
			'type' => 'dropdown',
			'heading' => "Border Style",
			'param_name' => 'pheromone_border_s',
			'value' => array( "solid", "dotted", "dashed"),
			"group" => "Border"
		),
		
		array(
			"type" => "textfield",
			"param_name" => "pheromone_border_r",
			"heading" => __("Border radius", 'pheromone'),
			"value" => '3px',
			"group" => "Border"
		),
	)
) );


