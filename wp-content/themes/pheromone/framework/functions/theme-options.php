<?php
/**
* Configure Kirki 
*/
function pheromone_customizer_config() {
     
    $args = array(
        'textdomain'   => 'pheromone',
    );
    return $args;
}
add_filter( 'kirki/config', 'pheromone_customizer_config' );

function pheromone_sections( $wp_customize ) {

    $wp_customize->add_section( 'pheromone_logo_section', array(
        'title'       => __( 'Header & Logo & Favicon', 'pheromone' ),
        'priority'    => 10,
    ) );

    $wp_customize->add_section( 'pheromone_content', array(
        'title'       => __( 'Blog', 'pheromone' ),
        'priority'    => 10,
    ) );

    $wp_customize->add_section( 'pheromone_portfolio', array(
        'title'       => __( 'Portfolio', 'pheromone' ),
        'priority'    => 10,
    ) );

    $wp_customize->add_section( 'pheromone_404', array(
        'title'       => __( '404 Error', 'pheromone' ),
        'priority'    => 10,
    ) );

    $wp_customize->add_section( 'pheromone_footer', array(
        'title'       => __( 'Footer', 'pheromone' ),
        'priority'    => 10,
    ) );

    $wp_customize->add_section( 'pheromone_other', array(
        'title'       => __( 'Other', 'pheromone' ),
        'priority'    => 10,
    ) );

    $wp_customize->add_section( 'pheromone_typography', array(
        'title'       => __( 'Typography', 'pheromone' ),
        'priority'    => 10,
    ) );
    
    if ( class_exists( 'WooCommerce' ) ) {
    $wp_customize->add_section( 'pheromone_woocommerce', array(
        'title'       => __( 'WooCommerce', 'pheromone' ),
        'priority'    => 10,
    ) );        
    };

}
add_action( 'customize_register', 'pheromone_sections' );

function pheromone_demo_fields( $fields ) {

        include( get_template_directory() . '/framework/functions/options/logo.php');
        include( get_template_directory() . '/framework/functions/options/content.php');
        include( get_template_directory() . '/framework/functions/options/portfolio.php');
        include( get_template_directory() . '/framework/functions/options/footer.php');
        if ( class_exists( 'WooCommerce' ) ) {
        include( get_template_directory() . '/framework/functions/options/woo.php');
        };
        include( get_template_directory() . '/framework/functions/options/404.php');
        include( get_template_directory() . '/framework/functions/options/typography.php');
        include( get_template_directory() . '/framework/functions/options/other.php');

    return $fields;
    
}
add_filter( 'kirki/fields', 'pheromone_demo_fields' );

?>