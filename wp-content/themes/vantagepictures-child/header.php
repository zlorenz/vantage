<!doctype html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <?php wp_head(); ?>
</head>

<?php
/**
 * Navbar settings + class builder
 * Pulls Customizer settings (scheme/position/search) and builds the final <nav> class string cleanly.
 * Use in: header.php (above the <nav> tag)
 */

$navbar_scheme   = get_theme_mod('navbar_scheme', 'navbar-dark');
$navbar_position = get_theme_mod('navbar_position', 'static');
$search_enabled  = get_theme_mod('search_enabled', '1');

$navbar_classes = 'navbar navbar-expand-md ' . $navbar_scheme;

if ($navbar_position === 'fixed_top') {
  $navbar_classes .= ' fixed-top';
} elseif ($navbar_position === 'fixed_bottom') {
  $navbar_classes .= ' fixed-bottom';
}
?>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a href="#main" class="visually-hidden-focusable">
  <?php esc_html_e('Skip to main content', 'vantagepictures'); ?>
</a>

<div id="wrapper">

  <header>
    <nav id="header" class="<?php echo esc_attr($navbar_classes); ?>" aria-label="Primary navigation">
      <div class="container-fluid">

        <a class="navbar-brand" href="<?php echo esc_url(home_url('/')); ?>" rel="home">
          <?php
            $header_logo = get_theme_mod('header_logo');
            if (!empty($header_logo)) :
          ?>
              <img src="<?php echo esc_url($header_logo); ?>" alt="<?php echo esc_attr(get_bloginfo('name', 'display')); ?>">
          <?php
            else :
              echo esc_html(get_bloginfo('name', 'display'));
            endif;
          ?>
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar"
          aria-controls="navbar" aria-expanded="false" aria-label="<?php esc_attr_e('Toggle navigation', 'vantagepictures'); ?>">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div id="navbar" class="collapse navbar-collapse">

          <?php
            wp_nav_menu([
              'menu_class'     => 'navbar-nav ms-auto',
              'container'      => '',
              'fallback_cb'    => 'WP_Bootstrap_Navwalker::fallback',
              'walker'         => new WP_Bootstrap_Navwalker(),
              'theme_location' => 'main-menu',
            ]);
          ?>

          <?php if ($search_enabled === '1') : ?>
            <form class="vp-search-form" role="search" method="get" action="<?php echo esc_url(home_url('/')); ?>">
              <div class="vp-search-wrapper">
                <input
                  type="text"
                  name="s"
                  class="vp-search-input"
                  placeholder="<?php esc_attr_e('Search', 'vantagepictures'); ?>"
                  aria-label="<?php esc_attr_e('Search', 'vantagepictures'); ?>"
                >
                <button type="submit" class="vp-search-button" aria-label="<?php esc_attr_e('Submit search', 'vantagepictures'); ?>">
                  <i class="fa fa-search" aria-hidden="true"></i>
                </button>
              </div>
            </form>
          <?php endif; ?>

        </div>
      </div>
    </nav>
  </header>

  <main id="main" class="site-main <?php
    if ($navbar_position === 'fixed_top') echo ' vp-has-fixed-top';
    if ($navbar_position === 'fixed_bottom') echo ' vp-has-fixed-bottom';
  ?>">