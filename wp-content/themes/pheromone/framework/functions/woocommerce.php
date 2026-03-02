<?php //Woocpmmerce


add_action('after_setup_theme', 'pheromone_woocommerce_support');
function pheromone_woocommerce_support()
{
    add_theme_support('woocommerce');
};

if (class_exists('WooCommerce')) {
    // Remove the product rating display on product loops
    remove_action('woocommerce_after_shop_loop_item_title', 'woocommerce_template_loop_rating', 5);
};

add_filter('woocommerce_show_page_title', 'woo_hide_page_title');
function woo_hide_page_title()
{
    return false;
};

function woocommerce_pagination()
{
    return false;
};



add_action('woocommerce_after_shop_loop_item', 'my_print_stars');


function my_print_stars()
{
    global $wpdb;
    global $post;
    $count = $wpdb->get_var("
    SELECT COUNT(meta_value) FROM $wpdb->commentmeta
    LEFT JOIN $wpdb->comments ON $wpdb->commentmeta.comment_id = $wpdb->comments.comment_ID
    WHERE meta_key = 'rating'
    AND comment_post_ID = $post->ID
    AND comment_approved = '1'
    AND meta_value > 0
");

    $rating = $wpdb->get_var("
    SELECT SUM(meta_value) FROM $wpdb->commentmeta
    LEFT JOIN $wpdb->comments ON $wpdb->commentmeta.comment_id = $wpdb->comments.comment_ID
    WHERE meta_key = 'rating'
    AND comment_post_ID = $post->ID
    AND comment_approved = '1'
");

    if ($count > 0) {

        $average = number_format($rating / $count, 2);


        echo '<span class="star-rating" title="' . sprintf(esc_html__('Rated %s out of 5', 'pheromone'), $average) . '"><span style="width:' . ($average * 16) . 'px"><span itemprop="ratingValue" class="rating">' . $average . '</span> </span></span>';
    }
}
function pheromone_woocommerce_image_dimensions()
{
    global $pagenow;

    if (!isset($_GET['activated']) || $pagenow != 'themes.php') {
        return;
    }
    $catalog = array(
        'width'     => '500',   // px
        'height'    => '585',   // px
        'crop'      => 0        // true
    );
    $single = array(
        'width'     => '750',   // px
        'height'    => '877',   // px
        'crop'      => 0        // true
    );
    $thumbnail = array(
        'width'     => '150',   // px
        'height'    => '175',   // px
        'crop'      => 0        // false
    );
    // Image sizes
    update_option('shop_catalog_image_size', $catalog);       // Product category thumbs
    update_option('shop_single_image_size', $single);         // Single product image
    update_option('shop_thumbnail_image_size', $thumbnail);   // Image gallery thumbs
}
add_action('after_switch_theme', 'pheromone_woocommerce_image_dimensions', 1);




if (get_theme_mod('pheromone_cart_disable') == true) {

    if (!function_exists('get_the_widget')) {

        function get_the_widget($widget, $instance = '', $args = '')
        {
            ob_start();
            the_widget($widget, $instance, $args);
            return ob_get_clean();
        }
    };

    // Ensure cart contents update when products are added to the cart via AJAX (place the following in functions.php)
    add_filter('woocommerce_add_to_cart_fragments', 'woocommerce_header_add_to_cart_fragment');
    function woocommerce_header_add_to_cart_fragment($fragments)
    {
        ob_start();
?>
        <div class="pheromone_head_cart">
            <a class="" href="<?php echo WC()->cart->get_cart_url(); ?>"><i class="pe-7s-shopbag"></i> <span class="pheromone_cart_icon"><?php echo sprintf(_n('%d', '%d', WC()->cart->cart_contents_count, 'pheromone'), WC()->cart->cart_contents_count); ?></span></a>
        </div>
<?php
        $fragments['div.pheromone_head_cart'] = ob_get_clean();
        return $fragments;
    }


    add_filter('wp_nav_menu_items', 'pheromone_cart_in_menu', 10, 2);
    function pheromone_cart_in_menu($menu, $args)
    {

        // Check if WooCommerce is active and add a new item to a menu assigned to Primary Navigation Menu location
        if (!in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins'))) || 'menu' !== $args->theme_location)
            return $menu;

        ob_start();
        global $woocommerce;
        $viewing_cart = esc_html__('View your shopping cart', 'pheromone');
        $start_shopping = esc_html__('Start shopping', 'pheromone');
        $cart_url = $woocommerce->cart->get_cart_url();

        $shop_page_url = WC()->cart->get_cart_url();
        $shop_page_in = sprintf(_n('%d', '%d', WC()->cart->cart_contents_count, 'pheromone'), WC()->cart->cart_contents_count);
        $shop_page_widget = get_the_widget('WC_Widget_Cart', 'title=');



        $cart_total = $woocommerce->cart->get_cart_total();
        // Uncomment the line below to hide nav menu cart item when there are no items in the cart

        $menu_item = '<li class="woocommerce_cart_menu">';
        $menu_item .= '<div class="pheromone_woo_cart">';
        $menu_item .= '<div class="pheromone_head_holder_inner">';
        $menu_item .= '<div class="pheromone_head_cart">';
        $menu_item .= '<a href="' . $shop_page_url . '"><i class="pe-7s-shopbag"></i> <span class="pheromone_cart_icon">' . $shop_page_in . '</span></a>';
        $menu_item .= '</div>';
        $menu_item .= '</div>';
        $menu_item .= ' <div class="pheromone_cart_widget">' . $shop_page_widget . '</div>';
        $menu_item .= '</div>';
        $menu_item .= '</li>';

        // Uncomment the line below to hide nav menu cart item when there are no items in the cart
        // }
        return $menu_item;
        $social = ob_get_clean();
        return $menu . $social;
    };
};
?>