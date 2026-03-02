<?php


     $fields[] = array(
        'type'        => 'typography',
        'settings'    => 'body_typography',
        'label'       => esc_attr__( 'Body Typography', 'pheromone' ),
        'section'     => 'pheromone_typography',
        'default'     => array(
            'font-family'    => 'Kanit',
            'variant'        => '200',
            'font-size'      => '16px',
            'line-height'    => '1.7',
            'letter-spacing' => '0.03em',
            'color'          => '#555',
            'text-transform' => 'none',
        ),
        'output'      => array(
            array(
                'element' => 'body',
            ),
        ),
        'choices' => array(
            'fonts' => array(
                'google'   => array( 'popularity', 1000 ),
                    'standard' => array(
                    'Georgia,Times,"Times New Roman",serif',
                    'Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
                ),
            ),
        ),
    );

     $fields[] = array(
        'type'        => 'typography',
        'settings'    => 'h1_typography',
        'label'       => esc_attr__( 'H1 Typography', 'pheromone' ),
        'section'     => 'pheromone_typography',
        'default'     => array(
            'font-family'    => 'Kanit',
            'variant'        => '300',
            'font-size'      => '36px',
            'line-height'    => '1.5',
            'letter-spacing' => '0.18em',
            'color'          => '',
            'text-transform' => 'uppercase',
        ),
        'output'      => array(
            array(
                'element' => 'h1',
            ),
        ),
        'choices' => array(
            'fonts' => array(
                'google'   => array( 'popularity', 1000 ),
                    'standard' => array(
                    'Georgia,Times,"Times New Roman",serif',
                    'Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
                ),
            ),
        ),
    );
     
     $fields[] = array(
        'type'        => 'typography',
        'settings'    => 'h2_typography',
        'label'       => esc_attr__( 'H2 Typography', 'pheromone' ),
        'section'     => 'pheromone_typography',
        'default'     => array(
            'font-family'    => 'Kanit',
            'variant'        => '300',
            'font-size'      => '30px',
            'line-height'    => '1.5',
            'letter-spacing' => '0.18em',
            'color'          => '',
            'text-transform' => 'uppercase',
        ),
        'output'      => array(
            array(
                'element' => 'h2',
            ),
        ),
        'choices' => array(
            'fonts' => array(
                'google'   => array( 'popularity', 1000 ),
                    'standard' => array(
                    'Georgia,Times,"Times New Roman",serif',
                    'Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
                ),
            ),
        ),
    );

     $fields[] = array(
        'type'        => 'typography',
        'settings'    => 'h3_typography',
        'label'       => esc_attr__( 'H3 Typography', 'pheromone' ),
        'section'     => 'pheromone_typography',
        'default'     => array(
            'font-family'    => 'Kanit',
            'variant'        => '300',
            'font-size'      => '24px',
            'line-height'    => '1.5',
            'letter-spacing' => '0.18em',
            'color'          => '',
            'text-transform' => 'uppercase',
        ),
        'output'      => array(
            array(
                'element' => 'h3',
            ),
        ),
        'choices' => array(
            'fonts' => array(
                'google'   => array( 'popularity', 1000 ),
                    'standard' => array(
                    'Georgia,Times,"Times New Roman",serif',
                    'Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
                ),
            ),
        ),
    );

     $fields[] = array(
        'type'        => 'typography',
        'settings'    => 'h4_typography',
        'label'       => esc_attr__( 'H4 Typography', 'pheromone' ),
        'section'     => 'pheromone_typography',
        'default'     => array(
            'font-family'    => 'Kanit',
            'variant'        => '300',
            'font-size'      => '18px',
            'line-height'    => '1.5',
            'letter-spacing' => '0.18em',
            'color'          => '',
            'text-transform' => 'uppercase',
        ),
        'output'      => array(
            array(
                'element' => 'h4',
            ),
        ),
        'choices' => array(
            'fonts' => array(
                'google'   => array( 'popularity', 1000 ),
                    'standard' => array(
                    'Georgia,Times,"Times New Roman",serif',
                    'Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
                ),
            ),
        ),
    );

     $fields[] = array(
        'type'        => 'typography',
        'settings'    => 'h5_typography',
        'label'       => esc_attr__( 'H5 Typography', 'pheromone' ),
        'section'     => 'pheromone_typography',
        'default'     => array(
            'font-family'    => 'Kanit',
            'variant'        => '300',
            'font-size'      => '14px',
            'line-height'    => '1.5',
            'letter-spacing' => '0.18em',
            'color'          => '',
            'text-transform' => 'uppercase',
        ),
        'output'      => array(
            array(
                'element' => 'h5',
            ),
        ),
        'choices' => array(
            'fonts' => array(
                'google'   => array( 'popularity', 1000 ),
                    'standard' => array(
                    'Georgia,Times,"Times New Roman",serif',
                    'Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
                ),
            ),
        ),
    );

     $fields[] = array(
        'type'        => 'typography',
        'settings'    => 'h6_typography',
        'label'       => esc_attr__( 'H6 Typography', 'pheromone' ),
        'section'     => 'pheromone_typography',
        'default'     => array(
            'font-family'    => 'Kanit',
            'variant'        => '300',
            'font-size'      => '12px',
            'line-height'    => '1.5',
            'letter-spacing' => '0.18em',
            'color'          => '',
            'text-transform' => 'uppercase',
        ),
        'output'      => array(
            array(
                'element' => 'h6',
            ),
        ),
        'choices' => array(
            'fonts' => array(
                'google'   => array( 'popularity', 1000 ),
                    'standard' => array(
                    'Georgia,Times,"Times New Roman",serif',
                    'Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
                ),
            ),
        ),
    );

     $fields[] = array(
        'type'        => 'typography',
        'settings'    => 'signature_typography',
        'label'       => esc_attr__( 'Signature Typography', 'pheromone' ),
        'section'     => 'pheromone_typography',
        'default'     => array(
            'font-family'    => 'Great Vibes',
            'variant'        => '400',
            'font-size'      => '30px',
            'line-height'    => '1.5',
            'letter-spacing' => '0.02em',
            'color'          => '',
            'text-transform' => 'capitalize',
        ),
        'output'      => array(
            array(
                'element' => '.signature_vc, blockquote cite a, .classic',
            ),
        ),
        'choices' => array(
            'fonts' => array(
                'google'   => array( 'popularity', 1000 ),
            ),
        ),
    );