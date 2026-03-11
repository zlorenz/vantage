<?php
/**
 * Presentation layer.
 * Renders Lark interactive card from mapped producer-brief data only.
 * No direct use of raw Gravity Forms fields.
 *
 * @package VP_Lark_Client_Brief
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Builds Lark card structure from normalized mapped brief.
 */
class VP_Lark_Presentation {

	/**
	 * Field labels that render on one line (label + value, no line break).
	 * Project Basics + Contact only.
	 *
	 * @var string[]
	 */
	private static $one_line_labels = array(
		'Project',
		'Company',
		'Project Type',
		'Lead Source',
		'Other Source',
		'Referred By',
		'Contact Person',
		'Job Title',
		'Email',
		'Phone',
		'Budget',
		'Flexibility',
		'Product Focus',
		'Product Name',
		'Image Count',
	);

	/**
	 * Builds Lark interactive card from mapped brief data.
	 *
	 * @param array  $mapped   Output from VP_Lark_Mapper::map_to_brief().
	 * @param int    $entry_id GF entry ID.
	 * @param int    $form_id  GF form ID.
	 * @return array Card structure (config, header, elements).
	 */
	public static function build_card( $mapped, $entry_id, $form_id = 1 ) {
		$admin_url = VP_Lark_Helpers::get_admin_entry_url( $form_id, $entry_id );
		$elements  = array();

		$card = array(
			'config'   => array( 'wide_screen_mode' => true ),
			'header'   => array(
				'title' => array(
					'tag'     => 'plain_text',
					'content' => 'NEW CLIENT BRIEF SUBMITTED (#' . $entry_id . ')',
				),
			),
			'elements' => &$elements,
		);

		$sections = isset( $mapped['sections'] ) ? $mapped['sections'] : array();

		foreach ( $sections as $section_key => $items ) {
			if ( empty( $items ) ) {
				continue;
			}
			foreach ( $items as $item ) {
				$label = isset( $item['label'] ) ? $item['label'] : '';
				$value = isset( $item['value'] ) ? $item['value'] : '';
				if ( $label === '' ) {
					continue;
				}
				if ( is_array( $value ) ) {
					// File URLs: render one link per line.
					$lines = array();
					foreach ( $value as $url ) {
						if ( is_string( $url ) && $url !== '' ) {
							$filename = VP_Lark_Helpers::extract_filename_from_url( $url );
							$lines[]  = sprintf( '[%s](%s)', $filename, $url );
						}
					}
					if ( empty( $lines ) ) {
						continue;
					}
					$value_str = implode( "\n", $lines );
				} else {
					$value_str = (string) $value;
					$value_str = VP_Lark_Mapper::maybe_trim( $value_str );
					if ( $value_str === '' ) {
						continue;
					}
					// Contact email: make clickable mailto link.
					if ( $label === 'Email' && is_email( $value_str ) ) {
						$value_str = sprintf( '[%s](mailto:%s)', $value_str, $value_str );
					}
					// Deliverables: comma-separated → bullet list with line breaks.
					if ( $label === 'Deliverables' ) {
						$parts     = array_map( 'trim', explode( ',', $value_str ) );
						$parts     = array_filter( $parts );
						$value_str = implode( "\n", array_map( function ( $p ) {
							return '- ' . $p;
						}, $parts ) );
					}
				}
				$separator = in_array( $label, self::$one_line_labels, true ) ? ' ' : "\n";
				$content   = '**' . $label . ':**' . $separator . $value_str;
				$elements[] = array(
					'tag'  => 'div',
					'text' => array(
						'tag'     => 'lark_md',
						'content' => $content,
					),
				);
			}
		}

		// Divider before footer.
		$elements[] = array( 'tag' => 'hr' );

		// View entry button.
		$elements[] = array(
			'tag'     => 'action',
			'actions' => array(
				array(
					'tag'    => 'button',
					'text'   => array(
						'tag'     => 'plain_text',
						'content' => 'View entry',
					),
					'url'    => $admin_url,
					'type'   => 'primary',
					'value'  => array(),
				),
			),
		);

		return $card;
	}
}
