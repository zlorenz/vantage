<?php
/**
 * The template for displaying product content within loops
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/content-product.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://docs.woocommerce.com/document/template-structure/
 * @author  WooThemes
 * @package WooCommerce/Templates
 * @version      100.0
 * @orig_version 3.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

global $product;

// Ensure visibility
if ( empty( $product ) || ! $product->is_visible() ) {
    return;
}
?>
<article <?php post_class('pheromone_mas_item'); ?>>

        <div class="shop-item">
            <div class="badge pricing"><?php woocommerce_template_loop_price(); ?></div>
            <div class="badge pricing sale"><?php esc_html_e( 'Sale', 'pheromone' )?></div>
            <div class="badge pricing featured"><?php esc_html_e( 'Trend', 'pheromone' )?></div>
            <?php woocommerce_template_loop_add_to_cart() ?>
            <a href="<?php echo get_the_permalink() ?>">
                <?php the_post_thumbnail('pheromone_shop_main'); ?>
            </a>
        </div>
        <a href="<?php echo get_the_permalink() ?>">
              <h5><?php echo get_the_title() ?></h5>
        </a>

</article>