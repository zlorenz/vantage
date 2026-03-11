  </main><!-- /#main -->

  <footer id="footer">
    <div class="container">
      <div class="row align-items-center">
        <div class="col-sm-6">
          <p class="mb-0">
            <a
              href="mailto:info@vantage.pictures"
              title="<?php esc_attr_e('Send us an email', 'vantagepictures'); ?>"
            >
              info@vantage.pictures
            </a>
          </p>
        </div>

        <div class="col-sm-6 text-sm-end mt-3 mt-sm-0">
          <ul class="list-inline mb-0 vp-footer-social">
            <li class="list-inline-item">
              <a href="https://vimeo.com/vantagepictures" target="_blank" rel="noopener noreferrer">
                <i class="fa fa-vimeo"></i>
              </a>
            </li>
            <li class="list-inline-item">
              <a href="https://www.instagram.com/vantage.pictures/" target="_blank" rel="noopener noreferrer">
                <i class="fa fa-instagram"></i>
              </a>
            </li>
            <li class="list-inline-item">
              <a href="https://www.facebook.com/vantagepictures" target="_blank" rel="noopener noreferrer">
                <i class="fa fa-facebook"></i>
              </a>
            </li>
            <li class="list-inline-item">
              <a href="https://www.linkedin.com/company/vantage-pictures" target="_blank" rel="noopener noreferrer">
                <i class="fa fa-linkedin"></i>
              </a>
            </li>
            <li class="list-inline-item">
              <a href="https://www.youtube.com/@vantage.pictures" target="_blank" rel="noopener noreferrer">
                <i class="fa fa-youtube-play"></i>
              </a>
            </li>
            <li class="list-inline-item">
              <a href="https://www.xinpianchang.com/u11835825" target="_blank" rel="noopener noreferrer">
                <i class="xinpianchang" aria-hidden="true">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 600 615.8"
                    role="img"
                    focusable="false"
                  >
                    <g transform="translate(0.000000,700.000000) scale(0.100000,-0.100000)">
                      <path class="fill-color" d="M1524.8,6986.5c-334-46-612-184-836-418c-381-397-593-1019-675-1977c-21-243-17-1162,5-1400 c54-573,152-1004,307-1355c110-248,219-413,380-575c244-246,522-372,900-411c669-68,1665,288,2761,987l145,93l180-49 c481-131,707-190,711-186c3,2-41,176-98,386l-102,382l136,136c252,255,382,430,502,677c282,580,191,1142-279,1729 c-102,128-346,372-496,497c-550,460-1408,965-2095,1234c-356,140-664,220-970,255C1879.8,7004.5,1642.8,7002.5,1524.8,6986.5z  M1467.8,4790.5c151-32,249-127,307-297l26-77l3-617l3-618h-170h-170l-3,573l-3,572l-25,50c-32,65-77,95-142,95c-27,0-64-7-83-15 c-49-20-131-100-198-193l-57-79v-502v-501h-170h-170v795v795h144h143l7-37c3-21,6-73,6-116v-77l93,93 C1152.8,4780.5,1291.8,4827.5,1467.8,4790.5z M2962.8,4785.5c117-24,196-67,284-154c89-88,136-175,170-315c18-75,22-118,21-257 c0-92-3-171-7-177c-4-8-153-11-472-11h-466l6-63c16-172,115-300,266-343c108-32,374-8,579,52l22,6v-150v-151l-52-16 c-159-48-454-76-592-56c-373,53-576,332-576,791c0,293,80,522,239,681C2536.8,4774.5,2739.8,4831.5,2962.8,4785.5z M3919.8,4763.5 c2-4,30-230,61-502c30-272,59-524,63-560l8-65l22,85c13,47,58,202,100,345l77,260h130h130l56-170c31-93,80-250,110-347 c29-98,54-177,55-175c3,3,36,332,74,727c16,173,32,336,36,363l6,47h154c85,0,154-2,154-4s-45-358-100-792s-100-790-100-791 c0-2-87-3-192-3h-193l-55,183c-30,100-72,246-95,324c-22,78-43,144-46,148c-3,3-11-20-18-51c-7-30-48-177-92-325 c-43-148-79-272-79-274c0-3-88-5-195-5c-149,0-195,3-195,13c0,6-45,361-99,787c-55,426-97,778-95,782 C3608.8,4774.5,3912.8,4773.5,3919.8,4763.5z"></path><path class="fill-color" d="M2690.8,4487.5c-95-44-162-148-183-281l-9-55h299h300l-7,63c-15,131-72,229-157,271 C2862.8,4520.5,2762.8,4521.5,2690.8,4487.5z"></path></g>
                  </svg>
                </i>
                <span class="screen-reader-text">
                  <?php esc_html_e('Xinpianchang', 'vantagepictures'); ?>
                </span>
              </a>
            </li>
          </ul>
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