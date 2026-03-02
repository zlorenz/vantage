jQuery(document).on('ready', function () {

  jQuery('#apiKey').on('submit', function (e) {
    e.preventDefault();
    var reconnect_value = jQuery('.reconnect').val();
    jQuery.post(
      ajaxurl,
      {
        'action': 'add_cstu_api_key',
        'data': {
          'key': jQuery('.api_key').val(),
          nonce_ajax: ajax_object.security

        },
        'reconnect': reconnect_value,

      },
      function (response) {
        // var is_zero = false;
        // try {
        //     if (response.substr(-1) == 0) {
        //         console.debug('it is 0');
        //         is_zero = true;
        //     }
        // }
        // catch (m) {
        //
        // }
        //
        // if (is_zero) {
        // response = JSON.parse(response.substr(0, response.length - 1));
        response = JSON.parse(response);
        if (response.status) {
          alert(response.message);
          window.location.reload();
        }
        else {
          alert(response.message);
        }
        // }

      }
    );
  });


  jQuery('#cs-save-in-wp').on('click', function (e) {
    var cs_save_in_wp = jQuery(this).is(":checked");
    // Use settings_nonce if available, fallback to security for backward compatibility
    var nonce = ajax_object.settings_nonce || ajax_object.security;
    jQuery
      .post(
        ajaxurl,
        {
          action: "add_cstu_settings",
          data: {
            cs_save_in_wp: cs_save_in_wp,
            nonce_ajax: nonce,
          },
        },
        function (response) {
          try {
            if (typeof response === "string") {
              response = JSON.parse(response);
            }
            if (response.status) {
              // Optional: show success message
            } else {
              alert(response.message || "Something went wrong");
            }
          } catch (err) {
            console.error("Error parsing response:", err);
          }
        }
      )
      .fail(function (xhr) {
        alert("Request failed. Please try again.");
      });
  });


});
