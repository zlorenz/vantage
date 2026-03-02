<?php
/**
 * The template for displaying product content in the single-product.php template
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/content-single-product.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see 	    https://docs.woocommerce.com/document/template-structure/
 * @author 		WooThemes
 * @package 	WooCommerce/Templates
 * @version      100.0
 * @orig_version 3.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

?>
<?php
	/**
	 * woocommerce_before_single_product hook.
	 *
	 * @hooked wc_print_notices - 10
	 */
	 do_action( 'woocommerce_before_single_product' );

	 if ( post_password_required() ) {
	 	echo get_the_password_form();
	 	return;
	 }
?>

<div id="product-<?php the_ID(); ?>" <?php post_class('row'); ?>>


<div id="carousel-shop" class="carousel slide">

	<div class="col-lg-6 carousel-outer">
		<?php echo woocommerce_show_product_images(); ?>
	</div>


	<div class="col-lg-6 slide summary entry-summary">
		<?php echo woocommerce_template_single_title(); ?>
		<?php echo woocommerce_template_single_rating(); ?>
		<?php echo woocommerce_template_single_excerpt(); ?>
		<?php echo woocommerce_show_product_thumbnails(); ?>
		<?php echo woocommerce_template_single_price(); ?>
		<?php echo woocommerce_template_single_add_to_cart(); ?>
		<?php echo woocommerce_template_single_meta(); ?>
	</div>
</div>

<div class="col-lg-12">
	<?php echo woocommerce_output_related_products(); ?>
</div>

<meta itemprop="url" content="<?php the_permalink(); ?>" />

</div><!-- #product-<?php the_ID(); ?> -->

<?php do_action( 'woocommerce_after_single_product' ); ?>
