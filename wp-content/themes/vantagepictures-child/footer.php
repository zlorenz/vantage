  </main><!-- /#main -->

  <?php
  /**
   * Footer: email and social links from Contact Info options.
   * Email uses contact_email; social links use social_* URL fields (empty = hidden).
   */
  $footer_email = function_exists( 'get_field' ) ? trim( (string) get_field( 'contact_email', 'option' ) ) : '';
  $social_links = array(
    array( 'option' => 'social_vimeo',        'icon' => 'fa', 'class' => 'fa-vimeo',        'title' => __( 'Find Vantage Pictures on Vimeo', 'vantagepictures' ) ),
    array( 'option' => 'social_instagram',   'icon' => 'fa', 'class' => 'fa-instagram',   'title' => __( 'Find Vantage Pictures on Instagram', 'vantagepictures' ) ),
    array( 'option' => 'social_facebook',    'icon' => 'fa', 'class' => 'fa-facebook',    'title' => __( 'Find Vantage Pictures on Facebook', 'vantagepictures' ) ),
    array( 'option' => 'social_linkedin',    'icon' => 'fa', 'class' => 'fa-linkedin',    'title' => __( 'Find Vantage Pictures on LinkedIn', 'vantagepictures' ) ),
    array( 'option' => 'social_youtube',     'icon' => 'fa', 'class' => 'fa-youtube-play','title' => __( 'Find Vantage Pictures on YouTube', 'vantagepictures' ) ),
    array( 'option' => 'social_xinpianchang', 'icon' => 'xinpianchang', 'class' => '', 'title' => __( 'Find Vantage Pictures on Xinpianchang', 'vantagepictures' ) ),
    array( 'option' => 'social_xiaohongshu', 'icon' => 'xiaohongshu', 'class' => '', 'title' => __( 'Find Vantage Pictures on Xiaohongshu (Rednote)', 'vantagepictures' ) ),
  );
  $footer_social_urls = array();
  if ( function_exists( 'get_field' ) ) {
    foreach ( $social_links as $item ) {
      $url = trim( (string) get_field( $item['option'], 'option' ) );
      if ( $url !== '' ) {
        $footer_social_urls[] = array_merge( $item, array( 'url' => $url ) );
      }
    }
  }
  ?>

  <footer id="footer">
    <div class="container">
      <div class="row align-items-center">
        <div class="col-sm-6">
          <?php if ( $footer_email !== '' ) : ?>
            <?php $footer_email_safe = antispambot( $footer_email ); ?>
            <p class="mb-0">
              <a href="mailto:<?php echo esc_attr( $footer_email_safe ); ?>" title="<?php esc_attr_e( 'Send us an email', 'vantagepictures' ); ?>">
                <?php echo esc_html( $footer_email_safe ); ?>
              </a>
            </p>
          <?php endif; ?>
        </div>

        <div class="col-sm-6 text-sm-end mt-3 mt-sm-0">
          <?php if ( ! empty( $footer_social_urls ) ) : ?>
            <ul class="list-inline mb-0 vp-footer-social">
              <?php foreach ( $footer_social_urls as $item ) : ?>
                <li class="list-inline-item">
                  <a href="<?php echo esc_url( $item['url'] ); ?>" target="_blank" rel="noopener noreferrer" title="<?php echo esc_attr( $item['title'] ); ?>" aria-label="<?php echo esc_attr( $item['title'] ); ?>">
                    <?php if ( $item['icon'] === 'xinpianchang' ) : ?>
                      <i class="xinpianchang" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 615.8" role="img" focusable="false">
                          <g transform="translate(0.000000,700.000000) scale(0.100000,-0.100000)">
                            <path class="fill-color" d="M1524.8,6986.5c-334-46-612-184-836-418c-381-397-593-1019-675-1977c-21-243-17-1162,5-1400 c54-573,152-1004,307-1355c110-248,219-413,380-575c244-246,522-372,900-411c669-68,1665,288,2761,987l145,93l180-49 c481-131,707-190,711-186c3,2-41,176-98,386l-102,382l136,136c252,255,382,430,502,677c282,580,191,1142-279,1729 c-102,128-346,372-496,497c-550,460-1408,965-2095,1234c-356,140-664,220-970,255C1879.8,7004.5,1642.8,7002.5,1524.8,6986.5z  M1467.8,4790.5c151-32,249-127,307-297l26-77l3-617l3-618h-170h-170l-3,573l-3,572l-25,50c-32,65-77,95-142,95c-27,0-64-7-83-15 c-49-20-131-100-198-193l-57-79v-502v-501h-170h-170v795v795h144h143l7-37c3-21,6-73,6-116v-77l93,93 C1152.8,4780.5,1291.8,4827.5,1467.8,4790.5z M2962.8,4785.5c117-24,196-67,284-154c89-88,136-175,170-315c18-75,22-118,21-257 c0-92-3-171-7-177c-4-8-153-11-472-11h-466l6-63c16-172,115-300,266-343c108-32,374-8,579,52l22,6v-150v-151l-52-16 c-159-48-454-76-592-56c-373,53-576,332-576,791c0,293,80,522,239,681C2536.8,4774.5,2739.8,4831.5,2962.8,4785.5z M3919.8,4763.5 c2-4,30-230,61-502c30-272,59-524,63-560l8-65l22,85c13,47,58,202,100,345l77,260h130h130l56-170c31-93,80-250,110-347 c29-98,54-177,55-175c3,3,36,332,74,727c16,173,32,336,36,363l6,47h154c85,0,154-2,154-4s-45-358-100-792s-100-790-100-791 c0-2-87-3-192-3h-193l-55,183c-30,100-72,246-95,324c-22,78-43,144-46,148c-3,3-11-20-18-51c-7-30-48-177-92-325 c-43-148-79-272-79-274c0-3-88-5-195-5c-149,0-195,3-195,13c0,6-45,361-99,787c-55,426-97,778-95,782 C3608.8,4774.5,3912.8,4773.5,3919.8,4763.5z"></path>
                            <path class="fill-color" d="M2690.8,4487.5c-95-44-162-148-183-281l-9-55h299h300l-7,63c-15,131-72,229-157,271 C2862.8,4520.5,2762.8,4521.5,2690.8,4487.5z"></path>
                          </g>
                        </svg>
                      </i>
                      <span class="screen-reader-text"><?php echo esc_html( $item['title'] ); ?></span>
                    <?php elseif ( $item['icon'] === 'xiaohongshu' ) : ?>
                      <i class="xiaohongshu" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 377.97 376.53" role="img" focusable="false">
                          <path class="fill-color" d="M43.86,1.11C21.81,5.7,3.59,22.91,1.34,46.07c-2.33,23.92,0,49.25,0,73.3v149.53c0,27.5-6.94,64.79,10.75,87.96,19.11,25.02,53.98,19.06,81.6,19.06h214.03c8.48,0,18.08,1.24,26.39-.49,22.05-4.59,40.26-21.8,42.51-44.96,2.33-23.92,0-49.25,0-73.3V107.64c0-27.5,6.94-64.79-10.75-87.96C346.76-5.34,311.89.62,284.27.62H70.24c-8.48,0-18.08-1.24-26.39.49M177.26,134.02l-10.26,27.85h17.59l-14.66,35.18,13.19,1.47c-1.45,3.93-3.4,11.34-6.35,14.42-2.17,2.26-5.48,1.71-8.31,1.71-6.39,0-19.3,2.65-22.72-4.4-1.57-3.23.68-7.31,1.95-10.26,2.66-6.17,6.19-12.48,7.57-19.06-3.19,0-7.22.63-10.26-.49-11.4-4.19,1.28-22.52,3.91-28.83,1.85-4.43,4.04-14.05,8.06-16.86,5.65-3.94,14.24-1.21,20.28-.73M61.45,226.38c4.03,0,10.02,1.2,12.46-2.93,2.59-4.39.73-14.06.73-19.06v-48.38c0-4.53-2.29-18.38,1.71-21.26,3.29-2.37,17.1-1.87,18.57,2.2,2.4,6.66.24,17.83.24,24.92v46.91c0,8.04,1.39,17.39-1.95,24.92-3.19,7.18-18.04,13.59-25.41,8.06-3.24-2.43-5.55-11.6-6.35-15.39M284.27,134.02v7.33c5.47,0,12.33-1.12,17.59.49,17.56,5.36,16.13,22.61,16.13,37.63,2.93,0,5.93-.23,8.8.49,16.85,4.21,14.66,21.06,14.66,34.69,0,7.27,1.36,15.86-3.42,21.99-5.27,6.75-13.9,5.86-21.5,5.86-2.36,0-6.25.75-8.31-.73-3.85-2.77-5.54-11-6.35-15.39,4.82,0,13.51,1.65,17.35-1.95,4.52-4.25,2.67-20.86-2.69-23.7-2.84-1.5-7.16-.73-10.26-.73h-21.99v42.51h-20.52v-42.51h-20.52v-20.52h20.52v-17.59h-13.19v-20.52h13.19v-7.33h20.52M237.36,141.35v20.52h-11.73v61.57h19.06v19.06h-67.43l7.82-18.32,18.57-.73v-61.57h-11.73v-20.52h45.44M320.92,161.88c0-4.17-.76-9.17.49-13.19,4.9-15.82,28.76-3.07,16.86,10.02-1.35,1.49-3.73,2.22-5.62,2.69-3.75.94-7.89.49-11.73.49M61.45,161.88l-6.11,54.24-10.02,17.59-8.8-23.46,4.4-48.38h20.52M128.88,161.88l4.4,48.38-8.8,21.99h-2.93c-7.87-12.46-8.87-25.31-10.26-39.58-.99-10.14-2.93-20.58-2.93-30.78h20.52M284.27,161.88v17.59h13.19v-17.59h-13.19M174.32,223.45l-7.33,19.06h-32.25l7.82-19.79,11.24.24,20.52.49Z"/>
                        </svg>
                      </i>
                      <span class="screen-reader-text"><?php echo esc_html( $item['title'] ); ?></span>
                    <?php else : ?>
                      <i class="fa <?php echo esc_attr( $item['class'] ); ?>"></i>
                    <?php endif; ?>
                  </a>
                </li>
              <?php endforeach; ?>
            </ul>
          <?php endif; ?>
        </div>
      </div>
    </div>
  </footer>

</div><!-- /#wrapper -->

<?php
/**
 * Global contact modal.
 * Loaded once in the footer so it can be triggered from the main navigation on any page.
 */
get_template_part('template-parts/contact', 'modal');
?>

<?php wp_footer(); ?>
</body>
</html>