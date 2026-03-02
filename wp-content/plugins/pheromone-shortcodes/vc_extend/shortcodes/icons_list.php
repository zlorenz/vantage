<?php 
add_shortcode('pheromone_icons_list', 'pheromone_icons_list_f');
function pheromone_icons_list_f( $atts, $content = null)
{

	extract(shortcode_atts(
		array(
			'link' => '#',
			'display' => 'block',
			'font_size' => '42px',
			'line_height' => '42px',
			'color' => '#fff',
			'padding' => '0px',
			'margin' => '0px',
			'icon_type' => 'none',
			'icon_fontawesome' => '',
			'icon_openiconic' => '',
			'icon_typicons' => '',
			'icon_entypo' => '',
			'icon_linecons' => '',
			'icon_elusive' => '',
			'icon_etline' => '',
			'icon_iconmoon' => '',
			'icon_linearicons' => '',
			"css" => null
		), $atts)
	);
	
		switch ($icon_type) {
			case 'fontawesome':
			$icon = $atts['icon_fontawesome'];
		break;
			case 'openiconic':
			$icon = $atts['icon_openiconic'];
		break;
			case 'typicons':
			$icon = $atts['icon_typicons'];
		break;
			case 'entypo':
			$icon = $atts['icon_entypo'];
		break;
			case 'linecons':
			$icon = $atts['icon_linecons'];
		break;
			case 'elusive':
			$icon = $atts['icon_elusive'];
		break;
			case 'etline':
			$icon = $atts['icon_etline'];
		break;
			case 'iconmoon':
			$icon = $atts['icon_iconmoon'];
		break;
			case 'linearicons':
			$icon = $atts['icon_linearicons'];
		break;

		}

		vc_icon_element_fonts_enqueue($icon_type);

		$output = '<a href="'. esc_url($link) .'"><i class="'.esc_attr($icon_fontawesome).'" style="display:'.esc_attr($display).'; font-size:'.$font_size.'; line-height: '.$line_height.'; color: '.$color.'; margin:'.$margin.'; padding:'.$padding.';"></i></a>';

		return $output;
};

vc_map( array(
	"name" => __("Icons List",'pheromone'),
	"base" => "pheromone_icons_list",
	"category" => __('Pheromone','pheromone'),
	"params" => array(
			array(
				'type' => 'dropdown',
				'heading' => esc_html__('Display', 'universal-wp'),
				'param_name' => 'display',
				'value' => array(
					esc_attr__('block', 'universal-wp') => 'block',
					esc_attr__('inline-block', 'universal-wp') => 'inline-block',
				),
			),
			array(
				'type' => 'colorpicker',
				'param_name' => 'color',
				'heading' => esc_html__('Icon Color', 'universal-wp'),
				'value' => '#fff',
			),
			array(
				'type' => 'textfield',
				'param_name' => 'font_size',
				'heading' => esc_html__('Icon Font Size', 'universal-wp'),
				'value' => '42px',
			),
			array(
				'type' => 'textfield',
				'param_name' => 'line_height',
				'heading' => esc_html__('Icon Line Height', 'universal-wp'),
				'value' => '42px',
			),
			array(
				'type' => 'textfield',
				'heading' => esc_html__('Padding (px)', 'universal-wp'),
				'param_name' => 'padding',
				'value' => '0px',
			),
			array(
				'type' => 'textfield',
				'heading' => esc_html__('Margin (px)', 'universal-wp'),
				'param_name' => 'margin',
				'value' => '0px',
			),
			array(
				'type' => 'dropdown',
				'heading' => esc_html__('Icon library', 'universal-wp'),
				'value' => array(
					esc_attr__('None', 'universal-wp') => 'none',
					esc_attr__('Font Awesome', 'universal-wp') => 'fontawesome',
					esc_attr__('Open Iconic', 'universal-wp') => 'openiconic',
					esc_attr__('Typicons', 'universal-wp') => 'typicons',
					esc_attr__('Entypo', 'universal-wp') => 'entypo',
					esc_attr__('Linecons', 'universal-wp') => 'linecons',
					esc_attr__('Elusive', 'universal-wp') => 'elusive',
					esc_attr__('Etline', 'universal-wp') => 'etline',
					esc_attr__('Iconmoon', 'universal-wp') => 'iconmoon',
					esc_attr__('Linearicons', 'universal-wp') => 'linearicons',
				),
				'param_name' => 'icon_type',
				'admin_label' => true,
				'description' => esc_html__('Select icon library', 'universal-wp'),
			),
			array(
				'type' => 'iconpicker',
				'heading' => esc_html__('Icon', 'universal-wp'),
                'admin_label' => true,
				'param_name' => 'icon_fontawesome',
				'settings' => array(
					'emptyIcon' => false,
					'iconsPerPage' => 1000
				),
				'dependency' => array(
					'element' => 'icon_type',
					'value' => 'fontawesome'
				),
			),
			array(
				'type' => 'iconpicker',
				'heading' => esc_html__('Icon', 'universal-wp'),
                'admin_label' => true,
				'param_name' => 'icon_openiconic',
				'settings' => array(
					'emptyIcon' => false,
					'type' => 'openiconic',
					'iconsPerPage' => 1000
				),
				'dependency' => array(
					'element' => 'icon_type',
					'value' => 'openiconic'
				),
			),
			array(
				'type' => 'iconpicker',
				'heading' => esc_html__('Icon', 'universal-wp'),
                'admin_label' => true,
				'param_name' => 'icon_typicons',
				'settings' => array(
					'emptyIcon' => false,
					'type' => 'typicons',
					'iconsPerPage' => 1000
				),
				'dependency' => array(
					'element' => 'icon_type',
					'value' => 'typicons'
				),
			),
			array(
				'type' => 'iconpicker',
				'heading' => esc_html__('Icon', 'universal-wp'),
                'admin_label' => true,
				'param_name' => 'icon_entypo',
				'settings' => array(
					'emptyIcon' => false,
					'type' => 'entypo',
					'iconsPerPage' => 300
				),
				'dependency' => array(
					'element' => 'icon_type',
					'value' => 'entypo'
				),
			),
			array(
				'type' => 'iconpicker',
				'heading' => esc_html__('Icon', 'universal-wp'),
                'admin_label' => true,
				'param_name' => 'icon_linecons',
				'settings' => array(
					'emptyIcon' => false,
					'type' => 'linecons',
					'iconsPerPage' => 1000
				),
				'dependency' => array(
					'element' => 'icon_type',
					'value' => 'linecons'
				),
			),
			array(
				'type' => 'iconpicker',
				'heading' => esc_html__('Icon', 'universal-wp'),
                'admin_label' => true,
				'param_name' => 'icon_elusive',
				'settings' => array(
					'emptyIcon' => false,
					'type' => 'elusive',
					'iconsPerPage' => 1000
				),
				'dependency' => array(
					'element' => 'icon_type',
					'value' => 'elusive'
				),
			),
			array(
				'type' => 'iconpicker',
				'heading' => esc_html__('Icon', 'universal-wp'),
                'admin_label' => true,
				'param_name' => 'icon_etline',
				'settings' => array(
					'emptyIcon' => false,
					'type' => 'etline',
					'iconsPerPage' => 1000
				),
				'dependency' => array(
					'element' => 'icon_type',
					'value' => 'etline'
				),
			),
			array(
				'type' => 'iconpicker',
				'heading' => esc_html__('Icon', 'universal-wp'),
                'admin_label' => true,
				'param_name' => 'icon_iconmoon',
				'settings' => array(
					'emptyIcon' => false,
					'type' => 'iconmoon',
					'iconsPerPage' => 1000
				),
				'dependency' => array(
					'element' => 'icon_type',
					'value' => 'iconmoon'
				),
			),
			array(
				'type' => 'iconpicker',
				'heading' => esc_html__('Icon', 'universal-wp'),
                'admin_label' => true,
				'param_name' => 'icon_linearicons',
				'settings' => array(
					'emptyIcon' => false,
					'type' => 'linearicons',
					'iconsPerPage' => 1000
				),
				'dependency' => array(
					'element' => 'icon_type',
					'value' => 'linearicons'
				),
			),	
	)
) );