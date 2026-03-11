<?php
/**
 * Field discovery layer.
 * Reads GF form and entry, returns normalized field data for all real input fields.
 *
 * @package VP_Lark_Client_Brief
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Discovers and normalizes Gravity Forms field data from form + entry.
 */
class VP_Lark_Discovery {

	/** Field types to skip as output fields (page, section are display-only). */
	const SKIP_TYPES = array( 'page', 'section', 'html' );

	/** Field types that contain multi-line content. */
	const MULTILINE_TYPES = array( 'paragraph', 'textarea', 'post_content' );

	/** File field types. */
	const FILE_TYPES = array( 'file', 'fileupload' );

	/**
	 * Discovers all real input fields from form and entry.
	 *
	 * @param array $form  GF form object.
	 * @param array $entry GF entry.
	 * @return array[] List of discovered field arrays.
	 */
	public static function discover( $form, $entry ) {
		$fields = isset( $form['fields'] ) ? $form['fields'] : array();
		$result = array();
		$page_context = null;

		foreach ( $fields as $field ) {
			$ftype = isset( $field->type ) ? $field->type : '';

			// Skip page/section as output fields; use page for context.
			if ( $ftype === 'page' ) {
				$page_label = isset( $field->pageNumber ) ? 'Page ' . $field->pageNumber : null;
				if ( ! empty( $field->label ) ) {
					$page_context = trim( (string) $field->label );
				}
				continue;
			}
			if ( $ftype === 'section' ) {
				$page_context = isset( $field->label ) ? trim( (string) $field->label ) : $page_context;
				continue;
			}
			if ( in_array( $ftype, self::SKIP_TYPES, true ) ) {
				continue;
			}

			$discovered = self::discover_field( $field, $entry, $form, $page_context );
			if ( $discovered !== null ) {
				$result[] = $discovered;
			}
		}

		return $result;
	}

	/**
	 * Discovers a single field.
	 *
	 * @param object $field        GF field.
	 * @param array  $entry        GF entry.
	 * @param array  $form         GF form.
	 * @param string|null $page_context Page/section label for grouping.
	 * @return array|null Discovered field data or null.
	 */
	private static function discover_field( $field, $entry, $form, $page_context = null ) {
		$field_id   = isset( $field->id ) ? (int) $field->id : 0;
		$field_type = isset( $field->type ) ? $field->type : '';
		$label      = isset( $field->label ) ? trim( (string) $field->label ) : '';
		$admin_label = isset( $field->adminLabel ) && $field->adminLabel !== '' ? trim( (string) $field->adminLabel ) : null;

		$is_file      = in_array( $field_type, self::FILE_TYPES, true );
		$is_multiline = in_array( $field_type, self::MULTILINE_TYPES, true );
		$inputs       = isset( $field->inputs ) && is_array( $field->inputs ) ? $field->inputs : null;
		$choices      = isset( $field->choices ) && is_array( $field->choices ) ? $field->choices : null;
		$is_multi_input = ! empty( $inputs );

		$raw_value = null;
		$display_value = null;
		$is_empty = true;

		if ( $is_file ) {
			$raw_value = self::get_file_raw_value( $field, $entry );
			$display_value = $raw_value; // Array of URLs.
			$is_empty = empty( $raw_value );
		} else {
			$raw_value = self::get_field_raw_value( $field, $entry );
			$display_value = self::get_field_display_value( $field, $raw_value, $entry, $form, $is_multiline );
			$is_empty = $display_value === null || $display_value === '' || ( is_array( $display_value ) && empty( $display_value ) );
		}

		return array(
			'field_id'       => $field_id,
			'field_type'     => $field_type,
			'label'          => $label,
			'admin_label'    => $admin_label,
			'raw_value'      => $raw_value,
			'display_value'  => $display_value,
			'choices'        => $choices,
			'inputs'         => $inputs,
			'is_empty'       => $is_empty,
			'is_multi_input' => $is_multi_input,
			'is_file_upload' => $is_file,
			'is_multiline'   => $is_multiline,
			'page_context'   => $page_context,
		);
	}

	/**
	 * Gets raw value for a non-file field.
	 */
	private static function get_field_raw_value( $field, $entry ) {
		if ( ! class_exists( 'GFFormsModel' ) ) {
			$key = (string) ( isset( $field->id ) ? $field->id : '' );
			return isset( $entry[ $key ] ) ? $entry[ $key ] : null;
		}
		$field_obj = $field instanceof GF_Field ? $field : GF_Fields::create( $field );
		return GFFormsModel::get_lead_field_value( $entry, $field_obj );
	}

	/**
	 * Gets display value for a non-file field.
	 */
	private static function get_field_display_value( $field, $raw, $entry, $form, $is_multiline ) {
		if ( ! class_exists( 'GFCommon' ) || ! class_exists( 'GFFormsModel' ) ) {
			return $raw !== null && $raw !== '' ? (string) $raw : null;
		}

		$field_obj = $field instanceof GF_Field ? $field : GF_Fields::create( $field );

		if ( $is_multiline && $raw !== null && $raw !== '' ) {
			$display = is_array( $raw ) ? implode( "\n", $raw ) : (string) $raw;
		} else {
			$display = GFCommon::get_lead_field_display( $field_obj, $raw, $entry, true, 'text', 'email' );
			$display = (string) $display;
		}

		$display = wp_strip_all_tags( $display );
		if ( $is_multiline ) {
			$display = str_replace( array( "\r\n", "\r" ), "\n", $display );
			$display = preg_replace( '/\n{3,}/', "\n\n", $display );
		} else {
			$display = preg_replace( '/\s+/', ' ', $display );
		}
		$display = trim( $display );
		return $display !== '' ? $display : null;
	}

	/**
	 * Gets raw file URLs for file upload field.
	 */
	private static function get_file_raw_value( $field, $entry ) {
		$raw = null;
		if ( class_exists( 'GFFormsModel' ) ) {
			$field_obj = $field instanceof GF_Field ? $field : GF_Fields::create( $field );
			$raw       = GFFormsModel::get_lead_field_value( $entry, $field_obj );
		}
		if ( $raw === null || $raw === '' ) {
			$raw = isset( $entry[ (string) $field->id ] ) ? $entry[ (string) $field->id ] : null;
		}
		if ( empty( $raw ) ) {
			return array();
		}

		$decoded = is_string( $raw ) && strlen( $raw ) > 0 && ( $raw[0] === '[' || $raw[0] === '{' ) ? json_decode( $raw, true ) : $raw;
		$items   = is_array( $decoded ) ? $decoded : array( $raw );
		$urls    = array();

		foreach ( $items as $item ) {
			$url = null;
			if ( is_string( $item ) ) {
				$parts = explode( '|:|', $item, 2 );
				$url   = trim( $parts[0] );
			} elseif ( is_array( $item ) && isset( $item['url'] ) ) {
				$url = $item['url'];
			}
			if ( $url && ( filter_var( $url, FILTER_VALIDATE_URL ) || preg_match( '#^https?://#', $url ) ) ) {
				$urls[] = $url;
			}
		}

		return $urls;
	}

	/**
	 * Returns canonical key for a discovered field: admin_label > sanitized label > field_id.
	 */
	public static function get_canonical_key( $discovered ) {
		$admin = isset( $discovered['admin_label'] ) && $discovered['admin_label'] !== '' ? $discovered['admin_label'] : null;
		if ( $admin ) {
			return $admin;
		}
		$label = isset( $discovered['label'] ) ? $discovered['label'] : '';
		$sanitized = sanitize_title( $label );
		if ( $sanitized !== '' ) {
			return $sanitized;
		}
		return 'field_' . ( isset( $discovered['field_id'] ) ? $discovered['field_id'] : 0 );
	}
}
