<?php

/* ------------------------------------------------------------------------ */
/* SHORTCODES */
/* ------------------------------------------------------------------------ */

$uri = plugin_dir_path( __FILE__ );
include($uri.'shortcodes/slider/pheromone-slider.php');
include($uri.'shortcodes/slider/pheromone-image.php');
include($uri.'shortcodes/slider/pheromone-video.php');
include($uri.'shortcodes/slider/pheromone-kenburns.php');
include($uri.'shortcodes/slider/title_slider.php');
include($uri.'shortcodes/slider/sub_title_slider.php');
include($uri.'shortcodes/slider/mouse_slider.php');
include($uri.'shortcodes/slider/image_slider.php');
include($uri.'shortcodes/slider/rotate_text.php');
include($uri.'shortcodes/slider/button_slider.php');
include($uri.'shortcodes/slider/text_slider.php');
include($uri.'shortcodes/slider/slide_slider.php');
include($uri.'shortcodes/slider/mail_chimp.php');
include($uri.'shortcodes/slider/coming_soon.php');
include($uri.'shortcodes/circle.php');
include($uri.'shortcodes/services.php');
include($uri.'shortcodes/promo_title.php');
include($uri.'shortcodes/fun_fact.php');
include($uri.'shortcodes/pricing_tables.php');
include($uri.'shortcodes/contacts_us.php');
include($uri.'shortcodes/buttons.php');
include($uri.'shortcodes/custom_slider.php');
include($uri.'shortcodes/testimonial.php');
include($uri.'shortcodes/team_member.php');
include($uri.'shortcodes/team_member_2.php');
include($uri.'shortcodes/portfolio_item.php');
include($uri.'shortcodes/portfolio_item_2.php');
include($uri.'shortcodes/mailchimp.php');
include($uri.'shortcodes/g_map.php');
include($uri.'shortcodes/latest_news.php');
include($uri.'shortcodes/clients.php');
include($uri.'shortcodes/icons_list.php');
include($uri.'shortcodes/video-button.php');
include($uri.'shortcodes/quote.php');
include($uri.'shortcodes/comingsoon_1.php');
include($uri.'shortcodes/comingsoon_2.php');
include($uri.'shortcodes/comingsoon_3.php');


//Your "container" content element should extend WPBakeryShortCodesContainer class to inherit all required functionality
if ( class_exists( 'WPBakeryShortCodesContainer' ) ) {
    class WPBakeryShortCode_Pheromone_Hero_Slider extends WPBakeryShortCodesContainer {
    };
    class WPBakeryShortCode_Pheromone_Hero_Image extends WPBakeryShortCodesContainer {
    };
    class WPBakeryShortCode_Pheromone_Hero_Video extends WPBakeryShortCodesContainer {
    };
    class WPBakeryShortCode_Pheromone_Hero_KenBurns extends WPBakeryShortCodesContainer {
    };
	class WPBakeryShortCode_Pheromone_Custom_Slider extends WPBakeryShortCodesContainer {
    }
};

if ( class_exists( 'WPBakeryShortCode' ) ) {
    class WPBakeryShortCode_VC_Title_Slider extends WPBakeryShortCode {
    };
    class WPBakeryShortCode_VC_Sub_Title_Slider extends WPBakeryShortCode {
    };
    class WPBakeryShortCode_VC_Mouse_Slider extends WPBakeryShortCode {
    };
    class WPBakeryShortCode_VC_Image_Slider extends WPBakeryShortCode {
    };
    class WPBakeryShortCode_VC_Rotate_Title extends WPBakeryShortCode {
    };
    class WPBakeryShortCode_VC_Button_Slider extends WPBakeryShortCode {
    };
    class WPBakeryShortCode_VC_Text_Slider extends WPBakeryShortCode {
    };
    class WPBakeryShortCode_VC_Slide_Slider extends WPBakeryShortCode {
    };
    class WPBakeryShortCode_VC_MailChimp_Slider extends WPBakeryShortCode {
    };
    class WPBakeryShortCode_VC_ComingSoon_Slider extends WPBakeryShortCode {
    };
    class WPBakeryShortCode_Vc_Testimonial_Item extends WPBakeryShortCode {
    }
};
?>