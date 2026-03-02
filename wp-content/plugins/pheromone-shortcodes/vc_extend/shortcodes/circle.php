<?php 
/*Services*/
add_shortcode('pheromone_circle', 'pheromone_circle_f');
function pheromone_circle_f( $atts, $content = null)
{

	extract(shortcode_atts(
		array(
			'pheromone_title' => 'Design',
			'pheromone_value' => '0.85',
			'pheromone_color' => '#777',
			'white' => null,
			"css" => null,
		), $atts)
	);

	if ($white) $white = 'white';

	$output ='<div class="progress-circle '. esc_attr($white) .'">
				<div data-value="'. esc_attr($pheromone_value) .'" class="circle"><span></span></div>
              	<div class="agenda">'. esc_attr($pheromone_title) .'</div>
            </div>';
	$output .='
		<script>
(function($){
    "use strict";
    $(document).ready(function() {

        var el = $(".circle"),
            inited = false;
        el.appear({ force_process: true });
        el.on("appear", function() {
            if (!inited) {
                el.circleProgress();
                inited = true;
            }
        });
        $(".circle").circleProgress({
                size:100,
                fill: {color: "'.$pheromone_color.'"},
                startAngle: 300,
                animation: {duration: 4000}
            })
            .on("circle-animation-progress", function (event, progress, stepValue) {
                $(this).find("span").text((stepValue * 100).toFixed(1));
            });

		
    });
		})(jQuery);

		</script>';
	return $output;

};

/*Circle*/
vc_map( array(
	"name" => __("Animated Circle",'pheromone'),
	"base" => "pheromone_circle",
	"category" => __('Pheromone','pheromone'),
	"params" => array(
		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_title",
			"heading" => __("Icon", 'pheromone'),
			"value" => 'Design',
		),

		array(
			"type" => "textfield",
			"admin_label" => true,
			"param_name" => "pheromone_value",
			"heading" => __("Value", 'pheromone'),
			"value" => '0.85',
			"description" => __( 'From 0.1 to 1', 'pheromone' ),
		),
		array(
			"type" => "colorpicker",
			"admin_label" => true,
			"param_name" => "pheromone_color",
			"heading" => __("Main Color", 'pheromone'),
            "value" => '#777', 
		),
        array(
			"type" => "checkbox",
			"admin_label" => true,
			"heading" => __("White fonts", 'pheromone'),
			"param_name" => "white",
			"value" => array("Yes" => true),
		),
	)
) );