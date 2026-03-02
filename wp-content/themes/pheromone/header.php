<!DOCTYPE html>
<html <?php language_attributes(); ?>>

<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="profile" href="http://gmpg.org/xfn/11">
  <link rel="pingback" href="<?php bloginfo('pingback_url'); ?>">
  <?php $allowed_html_array = wp_kses_allowed_html('post') ?>
  <?php if (!function_exists('has_site_icon') || !has_site_icon()) { ?>
    <link rel="shortcut icon" href="<?php echo esc_url(get_theme_mod('pheromone_logo_favicon', get_template_directory_uri() . '/assets/images/favicon.png')); ?>"> <?php }; ?>
  <?php if (get_theme_mod('pheromone_logo_favicon')) : ?>
    <link rel="apple-touch-icon" sizes="144x144" href="<?php echo esc_url(get_theme_mod('pheromone_logo_favicon', get_template_directory_uri() . '/assets/images/favicon.png')); ?>" /><?php endif; ?>
  <?php wp_head(); ?>
  <!-- Global site tag (gtag.js) - Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=UA-130807362-2"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'UA-130807362-2');
  </script>

  <!-- Custom Override Stylesheet -->
  <link rel="stylesheet" id="custom-style-css" href="<?php echo get_template_directory_uri() . '/assets/css/custom-style.css?ver=5.7.2' ?>" type="text/css" media="all">

  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-W286QXW');</script>
  <!-- End Google Tag Manager -->

  <!-- Facebook Domain Verification -->
  <meta name="facebook-domain-verification" content="v6jaq6ozhsty67e0lj3f75w5zhcsm3" />

  <!-- Facebook Pixel Code -->
  <script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '975141066258934');
  fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=975141066258934&ev=PageView&noscript=1"
  /></noscript>
  <!-- End Facebook Pixel Code -->

  <!-- Mailchimp Integration -->
  <script id="mcjs">!function(c,h,i,m,p){m=c.createElement(h),p=c.getElementsByTagName(h)[0],m.async=1,m.src=i,p.parentNode.insertBefore(m,p)}(document,"script","https://chimpstatic.com/mcjs-connected/js/users/17c6f0cf0283736889af00707/1adcacca6cf9d1c06b3105d1f.js");</script>  
</head>

<body id="page-top" <?php body_class(); ?>>
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-W286QXW"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->
  <?php wp_body_open(); ?>
  <?php if (get_theme_mod('pheromone_preloader', 'enable') == true) { ?><div id="preloader">
      <div id="status"></div>
    </div><?php }; ?>

  <?php if (get_theme_mod('pheromone_scroll_up', 'enable') == true) { ?><a href="#top" class="scroll-top scroll-top-hidden"><i class="fa fa-angle-up"></i></a><?php }; ?>

  <div class="wrapper">
    <div class="header">
      <?php get_template_part('framework/content/menu'); ?>
    </div>

    <?php if (!is_page_template(array('homepage.php', 'coming-soon.php'))) { ?>
      <?php if (!is_search()) { ?>
        <?php if (!is_404()) { ?>
          <?php if (!is_single()) { ?>
            <?php if (!class_exists('WooCommerce') || !is_woocommerce()) { ?>

              <?php $post = get_post($id);
              $image = wp_get_attachment_image_src(get_post_thumbnail_id($id), 'wall-portfolio-squre'); ?>

              <?php if (has_post_thumbnail()) { ?>
                
                <div class="tag_line tag_line_image" data-background="<?php echo esc_url($image[0]); ?>">

                <?php } else { ?>

                  <div class="tag_line tag_line_image" data-background="<?php echo get_template_directory_uri() . '/assets/images/10.jpg' ?>">

                  <?php }; ?>

                  <div class="tag-body">
                    <div class="container">
                      <div class="row">
                        <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                          <?php if (is_page()) { ?>

                            <h1 class="tag_line_title"><?php the_title(); ?></h1>

                          <?php } elseif (is_front_page()) { ?>

                            <h1 class="tag_line_title"><?php esc_html_e('Blog', 'pheromone'); ?></h1>

                          <?php } elseif (is_tax(array('portfolio-category','industry','market'))) { ?>

                            <?php
                              $term = get_queried_object();
                              $tax_obj = ($term && !empty($term->taxonomy)) ? get_taxonomy($term->taxonomy) : null;
                              $tax_label = ($tax_obj && !empty($tax_obj->labels->name)) ? $tax_obj->labels->name : '';
                            ?>

                            <?php if ($tax_label) : ?>
                              <h1 class="tag_line_title"><span>Browsing by:</span> <?php echo esc_html($tax_label); ?></h1>
                            <?php endif; ?>

                          <?php } elseif (pheromone_is_blog()) { ?>

                            <?php if (is_archive()) { ?>

                              <?php if (!is_category()) : ?>
                                <h1 class="tag_line_title"><?php single_cat_title(); ?></h1>
                              <?php endif; ?>

                            <?php } ?>

                          <?php } ?>

                        </div>
                        <?php
                        global $post;
                        $id = 'featured_image_full';
                        if (get_post_meta($post->ID, $id, true)) {
                          echo '<div data-wow-delay="1s" class="scroll-btn hidden-xs wow fadeInDown"><a href="#first-block" class="page-scroll"><span class="mouse"><span class="weel"><span></span></span></span></a></div>';
                        }
                        ?>
                      </div>
                    </div>
                  </div>
                  </div>
                <?php }; ?>
              <?php }; ?>
            <?php }; ?>
          <?php } else { ?>
            <?php if (get_theme_mod('pheromone_search_image', 'enable')) { ?>
              <div class="tag_line tag_line_image" data-background="<?php echo esc_url(get_theme_mod('pheromone_search_image', get_template_directory_uri() . '/assets/images/10.jpg')); ?>">
              <?php } else { ?>
                <div class="tag_line tag_line_image" data-background="<?php echo get_template_directory_uri() . '/assets/images/10.jpg' ?>">
                <?php } ?>
                <div class="tag-body">
                  <div class="container">
                    <div class="row">
                      <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <h1 class="tag_line_title search-result">
                          <?php printf(wp_kses(__('<span>Search Results:</span> %s', 'pheromone'), $allowed_html_array), get_search_query()); ?>
                        </h1>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              <?php }; ?>
            <?php }; ?>
            <?php if (class_exists('WooCommerce')) { ?>
              <?php if (is_woocommerce()) { ?>
                <?php if (get_theme_mod('pheromone_woo_image', 'enable')) { ?>
                  <div class="tag_line tag_line_image" data-background="<?php echo esc_url(get_theme_mod('pheromone_woo_image', get_template_directory_uri() . '/assets/images/woo.jpg')); ?>">
                  <?php } else { ?>
                    <div class="tag_line tag_line_image" data-background="<?php echo get_template_directory_uri() . '/assets/images/woo.jpg' ?>">
                    <?php } ?>
                    <div class="tag-body">
                      <div class="container">
                        <div class="row">
                          <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                            <h1 class="tag_line_title"><?php woocommerce_page_title() ?></h1>
                            <div class="breadcrumbs"><?php woocommerce_breadcrumb() ?></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                  <?php }; ?>
                <?php }; ?>
                <div class="main-content">