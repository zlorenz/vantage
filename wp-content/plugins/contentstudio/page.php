<?php

/**
 * ContentStudio Settings Page Template
 *
 * @package ContentStudio
 */

if (!defined('ABSPATH')) {
    exit;
}

$contentstudio_plugin_media_url = esc_url(plugin_dir_url(__FILE__) . 'assets/');

/**
 * Echo the plugin media URL
 */
function contentstudio_media_url()
{
    echo esc_url(plugin_dir_url(__FILE__) . 'assets/');
}

$contentstudio_has_security_plugins = false;
if (isset($response['security_plugins']) && $response['security_plugins']) {
    foreach ($response['security_plugins'] as $contentstudio_key => $contentstudio_value) {
        if ($contentstudio_value == 1) {
            $contentstudio_has_security_plugins = true;
            break;
        }
    }
}
?>
<div class="contentstudio-plugin-container">
    <div class="contentstudio-plugin-head">
        <div class="contentstudio-content-section" style="display:flex; justify-content: center;">
            <img src="<?php contentstudio_media_url(); ?>img/logo.png" width="260" alt="ContentStudio">
        </div>
    </div>
    <div class="contentstudio-lower">
        <div class="contentstudio-content-section">
            <div class="contentstudio-notifications">
                <?php
                if ($contentstudio_has_security_plugins) {
                ?>
                    <p class="security-plugins-notify">Your have security plugins installed, please whitelist
                        ContentStudio IP addresses in the following plugins:</p>
                    <ul>
                        <?php
                        foreach ($response['security_plugins'] as $contentstudio_key => $contentstudio_value) {
                            if ($contentstudio_value == 1) {
                                echo '<li class="warning-plugin"><img class="warning-plugin-img" src="' . esc_url($contentstudio_plugin_media_url) . 'img/warning.svg"><strong> ' . esc_html(str_replace("_", " ", $contentstudio_key)) . '</strong></li>';
                            }
                        }
                        ?>
                    </ul>

                    <p><strong>NOTE:</strong> you can ignore this message if you have already whitelisted IP addresses.</p>
                <?php
                }
                ?>
            </div>
            <div class="contentstudio-box">
                <div class="left_section">
                    <h2>
                        <?php
                        if (isset($response) && isset($response['status']) && $response['status'] == true) :
                        ?>
                            Connection Status
                        <?php elseif (isset($response) && isset($response['status']) && $response['reconnect'] == true) :
                        ?>
                            Reconnect Website
                        <?php else :
                        ?>
                            Connect Website
                        <?php endif; ?>
                    </h2>
                </div>
                <div class="right_section">
                    <?php
                    if (isset($response) && isset($response['status']) && $response['reconnect'] == true) :
                    ?>
                        <a href="<?php echo esc_url(admin_url('admin.php?page=contentstudio_settings')); ?>">Go Back</a>
                    <?php endif; ?>
                </div>
                <div class="clear"></div>
            </div>

            <div class="contentstudio-box center_aligned">

                <?php
                if (isset($response) && isset($response['status']) && $response['status'] == true && $response['reconnect'] == false) {
                ?>

                    <h3>
                        <div class="notify-success-image">
                            <img src="<?php contentstudio_media_url(); ?>img/round.svg" class="img_success">
                        </div>
                    </h3>
                    <h3>
                        Your website is connected with ContentStudio platform.
                    </h3>
                    <p>
                        Do you want to reconnect your website? <a href="<?php echo esc_url(admin_url('admin.php?page=contentstudio_settings&reconnect=true')); ?>">Click
                            here</a>.
                    </p>
                <?php
                } else {


                ?>

                    <h3>
                        Enter your Website API key to connect with ContentStudio <span class="cs_info"><a href="https://docs.contentstudio.io/article/389-wordpress-api-key" target="_blank">(What is an API key?)</a></span>
                    </h3>
                    <?php
                    if (isset($response) && isset($response['reconnect']) && $response['reconnect'] == false) {
                    ?>
                        <p>
                            Don't have a ContentStudio account? <a href="https://app.contentstudio.io/signup?utm_source=wordpress-plugin">Create an
                                account</a>
                        </p>
                    <?php } ?>
                    <div class="contentstudio-input">
                        <form action="javascript:;" method="post" id="apiKey">
                            <div class="input_field">
                                <input name="api_key" type="text" class="regular-text code api_key">
                            </div>
                            <div class="input_submit">
                                <input type="submit" class="regular-text code" value="Connect With API Key">
                            </div>

                            <?php
                            if (isset($response) && isset($response['reconnect']) && $response['reconnect']) {
                            ?>
                                <input name="reconnect" class="reconnect" type="hidden" value="1">
                            <?php
                            } else {
                            ?>
                                <input name="reconnect" class="reconnect" type="hidden" value="0">
                            <?php
                            }
                            ?>

                        </form>
                        <div class="clear"></div>
                    </div>
                <?php
                }
                ?>

                <div class="contentstudio-box" style="margin-top: 20px;">
                    <div style="text-align:start;">
                        <label class="contentstudio-toggle-switch">
                            <input id="cs-save-in-wp" type="checkbox" <?php echo $response['save_media_in_wp'] ? 'checked' : ''; ?>>
                            <span class="contentstudio-slider"></span>
                        </label>
                        <span class="contentstudio-label">Save blog images to wordpress media library</span>
                    </div>
                    <div class="left_section">
                    </div>
                </div>

            </div>


        </div>
    </div>

</div>