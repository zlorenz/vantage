<?php
add_shortcode('vc_slide_slider', 'vc_slide_slider_f');
function vc_slide_slider_f( $atts, $content = null)
{
    extract(shortcode_atts(
        array(
            'pheromone_image' => null,
            'pheromone_type' => 'video',
            'pheromone_video_link' => 'https://vimeo.com/153485166',
            'pheromone_video_buttons_one' => 'Who We Are',
            'pheromone_video_buttons_two' => 'Contacts Us',
            'pheromone_video_buttons_one_href' => '#about',
            'pheromone_video_buttons_two_href' => '#contact',
            'pheromone_mouse' => true,
            'pheromone_video_mouse_href' => '#about',
            'pheromone_sub_title' => 'Responsive Business Theme',
            'pheromone_title' => 'Creative Agency',
            'pheromone_title_classic' => null,
            'css' => null,
        ), $atts)
    );

    if ($pheromone_title_classic) $pheromone_title_classic = 'classic';

    $image = wp_get_attachment_image_src($pheromone_image, true);
    $image = $image[0];

    $output ='<div class="item">
                <div style="background-image:url('. esc_url($image) .');" class="fill">
                    <div class="intro-body">';
                        if($pheromone_type == 'video'){
                            $output .='<a href="'. esc_url($pheromone_video_link) .'" data-rel="video" class="swipebox-video">
                                            <i class="icon-big ion-ios-play-outline wow fadeInUp"></i>
                                        </a>
                                        <h1 class="'. esc_attr($pheromone_title_classic) .' wow fadeInDown">'.esc_attr($pheromone_title).'</h1>
                                        <h4 class="wow fadeInUp">'.$pheromone_sub_title.'</h4>';
                        } elseif ($pheromone_type == 'buttons')  {
                            $output .='<h1 class="'. esc_attr($pheromone_title_classic) .' wow fadeInDown">'.esc_attr($pheromone_title).'</h1>
                                        <h4 class="wow fadeInUp">'.$pheromone_sub_title.'</h4>
                                          <ul class="list-inline lead">
                                            <li><a href="'.esc_url($pheromone_video_buttons_one_href).'" class="btn btn-border btn-lg page-scroll wow fadeInLeft">'.esc_attr($pheromone_video_buttons_one).'</a></li>
                                            <li><a href="'.esc_url($pheromone_video_buttons_two_href).'" class="btn btn-white btn-lg page-scroll wow fadeInRight">'.esc_attr($pheromone_video_buttons_two).'</a></li>
                                          </ul>';
                        } elseif ($pheromone_type == 'standard')  {
                            $output .='<h1 class="'. esc_attr($pheromone_title_classic) .' wow fadeInUp">'.esc_attr($pheromone_title).'</h1>
                                <h4 class="wow fadeInDown">'.$pheromone_sub_title.'</h4>';
                               if($pheromone_mouse == true){$output .='<div data-wow-delay="1s" class="scroll-btn hidden-xs wow fadeInDown"><a href="'.esc_attr($pheromone_video_mouse_href).'" class="page-scroll"><span class="mouse"><span class="weel"><span></span></span></span></a></div>';};
                        };
        $output .='</div>
                </div>
            </div>';

    return $output;
};

        
vc_map( array(
    "name" => __("Slider Item",'pheromone'),
    "base" => "vc_slide_slider",
    "content_element" => true,
    "as_child" => array('only' => 'pheromone_hero_slider'), // Use only|except attributes to limit parent (separate multiple values with comma)
    "category" => __('Headers','pheromone'),
    "params" => array(
        array(
            "type" => "dropdown",
            "admin_label" => true,
            "heading" => __("Slide Type", 'pheromone'),
            "param_name" => "pheromone_type",
            'value' => array(
                __( 'Video Type', 'pheromone' ) => 'video',
                __( 'Button Type', 'pheromone' ) => 'buttons',
                __( 'Standard Type', 'pheromone' ) => 'standard',
            ),
        ),
        array(
            "type" => "attach_image",
            "param_name" => "pheromone_image",
            "heading" => __("Image", 'pheromone'),
        ),  
        array(
            "type" => "textfield",
            "heading" => __("Title", 'pheromone'),
            "param_name" => "pheromone_title",
            "value" => 'Creative Agency', 
        ),
        array(
            "type" => "checkbox",
            "heading" => __("Modern Font?", 'pheromone'),
            "param_name" => "pheromone_title_classic",
            "value" => array("Yes" => true),
        ),
        array(
            "type" => "textarea_html",
            "heading" => __("Sub Title", 'pheromone'),
            "param_name" => "pheromone_sub_title",
            "value" => 'Responsive Multi-Concept Theme', 
        ),

        array(
            "type" => "textfield",
            "heading" => __("Video Url", 'pheromone'),
            "param_name" => "pheromone_video_link",
            "value" => 'https://vimeo.com/153485166', 
            "dependency" => array(
                "element" => "pheromone_type",
                "value" => 'video',
            ),
        ),
        array(
            "type" => "textfield",
            "heading" => __("Button #1", 'pheromone'),
            "param_name" => "pheromone_video_buttons_one",
            "value" => 'Who We Are', 
            "dependency" => array(
                "element" => "pheromone_type",
                "value" => 'buttons',
            ),
        ),
        array(
            "type" => "textfield",
            "heading" => __("Button #1 Href", 'pheromone'),
            "param_name" => "pheromone_video_buttons_one_href",
            "value" => '#about', 
            "dependency" => array(
                "element" => "pheromone_type",
                "value" => 'buttons',
            ),
        ),
        array(
            "type" => "textfield",
            "heading" => __("Button #2", 'pheromone'),
            "param_name" => "pheromone_video_buttons_two",
            "value" => 'Contacts Us', 
            "dependency" => array(
                "element" => "pheromone_type",
                "value" => 'buttons',
            ),
        ),
        array(
            "type" => "textfield",
            "heading" => __("Button #2 Href", 'pheromone'),
            "param_name" => "pheromone_video_buttons_two_href",
            "value" => '#contact', 
            "dependency" => array(
                "element" => "pheromone_type",
                "value" => 'buttons',
            ),
        ),
        array(
            "type" => "checkbox",
            "heading" => __("Animate Mouse", 'pheromone'),
            "param_name" => "pheromone_mouse",
            "value" => array("Yes" => true),
            "std" => true,
            "dependency" => array(
                "element" => "pheromone_type",
                "value" => 'standard',
            ),
        ),
        array(
            "type" => "textfield",
            "heading" => __("Animate Mouse Href", 'pheromone'),
            "param_name" => "pheromone_video_mouse_href",
            "value" => '#about', 
            "dependency" => array(
                "element" => "pheromone_type",
                "value" => 'standard',
            ),
        ),      
    )
) );