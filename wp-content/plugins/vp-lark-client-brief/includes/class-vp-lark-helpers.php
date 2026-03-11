<?php
/**
 * Helper functions for extracting and formatting Gravity Forms entry data.
 * Designed for reuse when upgrading to Lark card payloads.
 *
 * @package VP_Lark_Client_Brief
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Helpers for GF entry → human-readable output.
 */
class VP_Lark_Helpers {

	const MAX_TEXT_LENGTH = 2000;

	/**
	 * Producer-facing label map. Form label → short internal label.
	 *
	 * @var array<string, string>
	 */
	private static $producer_labels = array(
		// Project Basics
		'Project Title'                     => 'Project',
		'Company Name'                     => 'Company',
		'What type of project is this?'   => 'Project Type',
		'How did you hear about us?'       => 'Lead Source',
		'If other, please tell us where'   => 'Other Source',
		'Who referred you?'                => 'Referred By',
		// Contact
		'Name'                             => 'Contact',
		'Job Title'                        => 'Title',
		'Email'                            => 'Email',
		'Phone'                            => 'Phone',
		// Campaign Goals
		'What are the primary goals of your video campaign?'                                                                          => 'Campaign Goals',
		"What's the key message that you want to communicate to viewers?"                                                              => 'Key Message',
		'Desired runtime'                 => 'Runtime',
		'Target audience'                 => 'Audience',
		'Why will they care about the video? What value will it offer them?'                                                           => 'Viewer Value',
		'Describe the tone and style of the video. What emotions do you want to evoke in your audience?'                              => 'Tone / Style',
		'Are there any important themes, buzzwords or campaign slogans that we should focus on as we develop a concept? Anything we should explicitly avoid?' => 'Themes / Avoid',
		'Do you have any reference videos with a style that resonates with you? Either from our own portfolio or other videos that you found online.' => 'References',
		'Budget Range'                    => 'Budget',
		// Timeline & Release
		'How will this video be released and displayed?' => 'Distribution',
		'In which countries or regions will it be shared?' => 'Markets',
		'Final delivery deadline (is it fixed or flexible?)' => 'Deadline',
		'Is the release tied to any events, launches, or holidays?' => 'Launch Event',
		// Brand / Product
		'Is this campaign focused on a specific product or service?' => 'Product Focus',
		// Brand Profile
		'Describe your brand and services.' => 'Brand Overview',
		'Company mission or core values'  => 'Mission / Values',
		'Brand keywords'                  => 'Brand Keywords',
		// Product Details
		'Key product features to highlight' => 'Product Features',
		'Market pain points'              => 'Pain Points',
		'Differentiators / competitive advantage' => 'Differentiators',
		// Deliverables
		'What deliverables do you need?'  => 'Deliverables',
		// Cutdowns
		'What cutdown lengths do you need?' => 'Cutdown Lengths',
		'Where and how will those cutdowns be used?' => 'Cutdown Usage',
		// Social Versions
		'Which social channels will you be using?' => 'Social Channels',
		'Which aspect ratios / dimensions do you need?' => 'Aspect Ratios',
		'Any special platform-specific requirements?' => 'Platform Requirements',
		// Still Photography
		'What kind of stills are needed?' => 'Still Types',
		'Product only, lifestyle, team, event, or other?' => 'Still Style',
		'Approximate number of final images?' => 'Image Count',
		'Any usage needs?'                 => 'Still Usage',
		// Final Notes (form uses curly apostrophe U+2019)
		'Anything else you\'d like to add?'   => 'Additional Notes',
		"Anything else you\u{2019}d like to add?" => 'Additional Notes',
		// Attachments (file upload field label; file links rendered separately)
		'If you have other briefing materials, attach them here.' => 'Attachments',
	);

	/**
	 * Section order and which producer labels belong to each.
	 *
	 * @var array<string, string[]>
	 */
	private static $sections = array(
		'Project Basics'    => array( 'Project', 'Company', 'Project Type', 'Lead Source', 'Other Source', 'Referred By' ),
		'Contact'          => array( 'Contact', 'Title', 'Email', 'Phone' ),
		'Campaign Goals'    => array( 'Campaign Goals', 'Key Message', 'Runtime', 'Audience', 'Viewer Value', 'Tone / Style', 'Themes / Avoid', 'References', 'Budget' ),
		'Timeline & Release' => array( 'Distribution', 'Markets', 'Deadline', 'Launch Event' ),
		'Brand / Product'  => array( 'Product Focus' ),
		'Brand Profile'     => array( 'Brand Overview', 'Mission / Values', 'Brand Keywords' ),
		'Product Details'   => array( 'Product Features', 'Pain Points', 'Differentiators' ),
		'Deliverables'      => array( 'Deliverables' ),
		'Cutdowns'          => array( 'Cutdown Lengths', 'Cutdown Usage' ),
		'Social Versions'   => array( 'Social Channels', 'Aspect Ratios', 'Platform Requirements' ),
		'Still Photography' => array( 'Still Types', 'Still Style', 'Image Count', 'Still Usage' ),
		'Final Notes'       => array( 'Additional Notes' ),
		'Attachments'      => array(), // Populated by file links only.
	);

	/** @var string[] */
	private static $multiline_types = array( 'paragraph', 'textarea', 'post_content' );

	// -------------------------------------------------------------------------
	// Field extraction
	// -------------------------------------------------------------------------

	/**
	 * Extracts field data grouped by section. Returns [ section => [ [label, value], ... ] ].
	 *
	 * @param array $entry GF entry.
	 * @param array $form  GF form.
	 * @return array<string, array<array{0: string, 1: string}>>
	 */
	public static function extract_field_data_by_section( $entry, $form ) {
		$flat = self::extract_field_data( $entry, $form );
		$by_section = array();

		foreach ( self::$sections as $section => $labels_in_section ) {
			$items = array();
			foreach ( $labels_in_section as $label ) {
				if ( isset( $flat[ $label ] ) && $flat[ $label ] !== '' ) {
					$items[] = array( $label, $flat[ $label ] );
				}
			}
			if ( ! empty( $items ) ) {
				$by_section[ $section ] = $items;
			}
		}

		return $by_section;
	}

	/**
	 * Builds a flat array of producer_label => value for an entry.
	 *
	 * @param array $entry GF entry.
	 * @param array $form  GF form.
	 * @return array<string, string>
	 */
	public static function extract_field_data( $entry, $form ) {
		$data   = array();
		$fields = isset( $form['fields'] ) ? $form['fields'] : array();

		foreach ( $fields as $field ) {
			$field_type = isset( $field->type ) ? $field->type : '';
			if ( $field_type === 'file' ) {
				continue;
			}
			$value = self::get_readable_value( $field, $entry, $form );
			if ( $value === null || $value === '' ) {
				continue;
			}
			$form_label = self::get_field_label( $field );
			$label      = self::get_producer_label( $form_label );
			if ( $label === '' ) {
				continue;
			}
			$data[ $label ] = $value;
		}

		return $data;
	}

	public static function get_readable_value( $field, $entry, $form ) {
		if ( ! class_exists( 'GFCommon' ) || ! class_exists( 'GFFormsModel' ) ) {
			return null;
		}

		$field_obj    = $field instanceof GF_Field ? $field : GF_Fields::create( $field );
		$raw          = GFFormsModel::get_lead_field_value( $entry, $field_obj );
		$is_multiline = self::is_multiline_field( $field );

		if ( $is_multiline && $raw !== null && $raw !== '' ) {
			$display = is_array( $raw ) ? implode( "\n", $raw ) : (string) $raw;
		} else {
			$display = GFCommon::get_lead_field_display( $field_obj, $raw, $entry, true, 'text', 'email' );
			$display = (string) $display;
		}

		$display = trim( $display );
		if ( $display === '' ) {
			return null;
		}

		return self::format_field_value( $display, $is_multiline );
	}

	public static function is_multiline_field( $field ) {
		$type = isset( $field->type ) ? $field->type : '';
		return in_array( $type, self::$multiline_types, true );
	}

	public static function format_field_value( $value, $is_multiline = false ) {
		$value = wp_strip_all_tags( (string) $value );
		if ( $is_multiline ) {
			$value = self::format_multiline_value( $value );
		} else {
			$value = preg_replace( '/\s+/', ' ', $value );
		}
		$value = trim( $value );
		return $value !== '' ? $value : null;
	}

	public static function format_multiline_value( $value ) {
		$value = (string) $value;
		$value = str_replace( array( "\r\n", "\r" ), "\n", $value );
		$value = preg_replace( '/\n{3,}/', "\n\n", $value );
		return trim( $value );
	}

	public static function get_producer_label( $form_label ) {
		$form_label = trim( (string) $form_label );
		if ( $form_label === '' ) {
			return '';
		}
		if ( isset( self::$producer_labels[ $form_label ] ) ) {
			return self::$producer_labels[ $form_label ];
		}
		foreach ( self::$producer_labels as $map_key => $short ) {
			if ( strcasecmp( $map_key, $form_label ) === 0 ) {
				return $short;
			}
		}
		return $form_label;
	}

	public static function get_field_label( $field ) {
		$admin_label = isset( $field->adminLabel ) && $field->adminLabel !== '' ? $field->adminLabel : null;
		$label       = $admin_label ?: ( isset( $field->label ) ? $field->label : '' );
		return trim( (string) $label );
	}

	// -------------------------------------------------------------------------
	// File handling
	// -------------------------------------------------------------------------

	/**
	 * Collects file URLs from entry. Uses GF API when available; handles |:| metadata delimiter.
	 *
	 * @param array $entry GF entry.
	 * @param array $form  GF form.
	 * @return array List of raw URLs.
	 */
	public static function get_file_urls( $entry, $form ) {
		$urls   = array();
		$fields = isset( $form['fields'] ) ? $form['fields'] : array();

		foreach ( $fields as $field ) {
			$ftype = isset( $field->type ) ? $field->type : '';
			if ( $ftype !== 'file' && $ftype !== 'fileupload' ) {
				continue;
			}

			$raw = null;
			if ( class_exists( 'GFFormsModel' ) ) {
				$field_obj = $field instanceof GF_Field ? $field : GF_Fields::create( $field );
				$raw       = GFFormsModel::get_lead_field_value( $entry, $field_obj );
			}
			if ( $raw === null || $raw === '' ) {
				$raw = isset( $entry[ (string) $field->id ] ) ? $entry[ (string) $field->id ] : null;
			}
			if ( empty( $raw ) ) {
				continue;
			}

			$decoded = is_string( $raw ) && strlen( $raw ) > 0 && ( $raw[0] === '[' || $raw[0] === '{' ) ? json_decode( $raw, true ) : $raw;
			$items   = is_array( $decoded ) ? $decoded : array( $raw );

			foreach ( $items as $item ) {
				$url = null;
				if ( is_string( $item ) ) {
					// GF may store "url|:|title|:|caption" – use first segment as URL.
					$parts = explode( '|:|', $item, 2 );
					$url   = trim( $parts[0] );
				} elseif ( is_array( $item ) && isset( $item['url'] ) ) {
					$url = $item['url'];
				}
				if ( $url && ( filter_var( $url, FILTER_VALIDATE_URL ) || preg_match( '#^https?://#', $url ) ) ) {
					$urls[] = $url;
				}
			}
		}

		return $urls;
	}

	/**
	 * Returns formatted attachment links for Lark: [filename](url), one per line.
	 *
	 * @param array $entry GF entry.
	 * @param array $form  GF form.
	 * @return string[] Array of "[filename](url)" strings.
	 */
	public static function get_file_links_formatted( $entry, $form ) {
		$urls   = self::get_file_urls( $entry, $form );
		$links  = array();

		foreach ( $urls as $url ) {
			$filename = self::extract_filename_from_url( $url );
			$links[]  = sprintf( '[%s](%s)', $filename, $url );
		}

		return $links;
	}

	/**
	 * Extracts display filename from a GF file URL (direct or gf-download).
	 *
	 * @param string $url File URL.
	 * @return string Filename for display.
	 */
	public static function extract_filename_from_url( $url ) {
		$parsed = wp_parse_url( $url );
		if ( ! $parsed || ! isset( $parsed['path'] ) ) {
			return 'file';
		}

		// gf-download: ?gf-download=2026%2F03%2Ffilename.jpg&...
		if ( isset( $parsed['query'] ) && strpos( $parsed['query'], 'gf-download=' ) !== false ) {
			parse_str( $parsed['query'], $q );
			if ( ! empty( $q['gf-download'] ) ) {
				$path = $q['gf-download'];
				$path = str_replace( array( '%2F', '%2f' ), '/', $path );
				$base = basename( $path );
				if ( $base !== '' && $base !== '.' ) {
					return $base;
				}
			}
		}

		// Direct path: /wp-content/uploads/.../filename.pdf
		$base = basename( $parsed['path'] );
		return $base !== '' && $base !== '.' ? $base : 'file';
	}

	// -------------------------------------------------------------------------
	// Utilities
	// -------------------------------------------------------------------------

	public static function maybe_trim( $text, $max = self::MAX_TEXT_LENGTH ) {
		$text = (string) $text;
		if ( strlen( $text ) <= $max ) {
			return $text;
		}
		return substr( $text, 0, $max - 3 ) . '...';
	}

	public static function get_admin_entry_url( $form_id, $entry_id ) {
		return admin_url( sprintf( 'admin.php?page=gf_entries&view=entry&id=%d&lid=%d', (int) $form_id, (int) $entry_id ) );
	}
}
