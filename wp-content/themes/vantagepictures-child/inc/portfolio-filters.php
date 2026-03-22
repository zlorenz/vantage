<?php
/**
 * Portfolio filter dropdowns (Video Format, Industry, Market)
 * Outputs three taxonomy dropdowns that sync to URL params and JS/AJAX filtering
 */

if (!function_exists('vp_portfolio_filter_dropdowns')) {

  function vp_portfolio_filter_dropdowns() {

    $configs = [
      [
        'taxonomy'   => 'video-format',
        'param'      => 'format',
        'label'      => 'Video Format',
        'aria_label' => 'Filter portfolio by video format',
      ],
      [
        'taxonomy'   => 'industry',
        'param'      => 'industry',
        'label'      => 'Industry',
        'aria_label' => 'Filter portfolio by industry',
      ],
      [
        'taxonomy'   => 'market',
        'param'      => 'market',
        'label'      => 'Market',
        'aria_label' => 'Filter portfolio by market',
      ],
    ];

    echo '<div class="vp-filterbar" aria-label="Portfolio filters">';
    echo '<div class="vp-filterbar__inner">';

    foreach ($configs as $c) {

      $taxonomy = $c['taxonomy'];
      $param    = $c['param'];

      $terms = get_terms([
        'taxonomy'   => $taxonomy,
        'hide_empty' => true,
        'orderby'    => 'name',
        'order'      => 'ASC',
      ]);

      if (is_wp_error($terms) || empty($terms)) {
        continue;
      }

      $active_slug = isset($_GET[$param]) ? sanitize_key(wp_unslash($_GET[$param])) : '';

      echo '<div class="vp-filterbar__group">';
      echo '<label class="vp-filterbar__label" for="vp-filter-' . esc_attr($taxonomy) . '">' . esc_html($c['label']) . '</label>';

      echo '<div class="vp-select-wrap">';
      echo '<select class="vp-filterbar__select vp-tax-filter"'
        . ' id="vp-filter-' . esc_attr($taxonomy) . '"'
        . ' name="' . esc_attr($param) . '"'
        . ' data-taxonomy="' . esc_attr($taxonomy) . '"'
        . ' aria-label="' . esc_attr($c['aria_label']) . '">';

      echo '<option value=""' . selected($active_slug, '', false) . '>All</option>';

      foreach ($terms as $t) {
        echo '<option value="' . esc_attr($t->slug) . '"' . selected($active_slug, $t->slug, false) . '>';
        echo esc_html($t->name);
        echo '</option>';
      }

      echo '</select>';
      echo '</div>';
      echo '</div>';
    }

    echo '</div>';
    echo '</div>';
  }
}

if (!function_exists('vp_portfolio_internal_crew_filters')) {

  /**
   * Internal Work page: crew index taxonomies (client, director, dop, art-director).
   */
  function vp_portfolio_internal_crew_filters() {

    $configs = [
      [
        'taxonomy'   => 'client',
        'param'      => 'client',
        'label'      => 'Client',
        'aria_label' => 'Filter portfolio by client',
      ],
      [
        'taxonomy'   => 'director',
        'param'      => 'director',
        'label'      => 'Director',
        'aria_label' => 'Filter portfolio by director',
      ],
      [
        'taxonomy'   => 'dop',
        'param'      => 'dop',
        'label'      => 'DOP',
        'aria_label' => 'Filter portfolio by director of photography',
      ],
      [
        'taxonomy'   => 'art-director',
        'param'      => 'art-director',
        'label'      => 'Art Director',
        'aria_label' => 'Filter portfolio by art director',
      ],
    ];

    echo '<div class="vp-filterbar" aria-label="Portfolio crew filters">';
    echo '<div class="vp-filterbar__inner">';

    foreach ($configs as $c) {

      $taxonomy = $c['taxonomy'];
      $param    = $c['param'];

      $terms = get_terms([
        'taxonomy'   => $taxonomy,
        'hide_empty' => true,
        'orderby'    => 'name',
        'order'      => 'ASC',
      ]);

      if (is_wp_error($terms) || empty($terms)) {
        continue;
      }

      $active_slug = isset($_GET[$param]) ? sanitize_key(wp_unslash($_GET[$param])) : '';

      $id = 'vp-filter-' . sanitize_html_class(str_replace('/', '-', $taxonomy));

      echo '<div class="vp-filterbar__group">';
      echo '<label class="vp-filterbar__label" for="' . esc_attr($id) . '">' . esc_html($c['label']) . '</label>';

      echo '<div class="vp-select-wrap">';
      echo '<select class="vp-filterbar__select vp-internal-crew-filter"'
        . ' id="' . esc_attr($id) . '"'
        . ' name="' . esc_attr($param) . '"'
        . ' data-taxonomy="' . esc_attr($taxonomy) . '"'
        . ' aria-label="' . esc_attr($c['aria_label']) . '">';

      echo '<option value=""' . selected($active_slug, '', false) . '>All</option>';

      foreach ($terms as $t) {
        echo '<option value="' . esc_attr($t->slug) . '"' . selected($active_slug, $t->slug, false) . '>';
        echo esc_html($t->name);
        echo '</option>';
      }

      echo '</select>';
      echo '</div>';
      echo '</div>';
    }

    echo '</div>';
    echo '</div>';
  }
}