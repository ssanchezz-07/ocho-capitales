<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Tipos de contenido, taxonomías, campos y columnas de administración.
 */
class PCOF_Types {

	const CAPITAL   = 'pcof_capital';
	const HERMANDAD = 'pcof_hermandad';
	const BANDA     = 'pcof_banda';
	const IMAGINERO = 'pcof_imaginero';
	const NOTICIA   = 'pcof_noticia';
	const FUENTE    = 'pcof_fuente';

	const TAX_CIUDAD = 'pcof_ciudad';
	const TAX_DIA    = 'pcof_dia';

	public static function public_types() {
		return array( self::CAPITAL, self::HERMANDAD, self::BANDA, self::IMAGINERO );
	}

	public static function init() {
		add_action( 'init', array( __CLASS__, 'register' ), 5 );
		add_action( 'add_meta_boxes', array( __CLASS__, 'add_meta_boxes' ) );
		add_action( 'save_post', array( __CLASS__, 'save_meta' ), 10, 2 );
		add_action( 'pre_get_posts', array( __CLASS__, 'tweak_search' ) );
		foreach ( array( self::FUENTE, self::HERMANDAD ) as $t ) {
			add_filter( "manage_{$t}_posts_columns", array( __CLASS__, 'columns_' . $t ) );
			add_action( "manage_{$t}_posts_custom_column", array( __CLASS__, 'column_content' ), 10, 2 );
		}
		add_action( 'save_post', array( 'PCOF_Util', 'reset_caches' ) );
		add_action( 'deleted_post', array( 'PCOF_Util', 'reset_caches' ) );
	}

	private static function labels( $sing, $plur, $fem = false ) {
		$nuevo = $fem ? 'Nueva' : 'Nuevo';
		$todos = $fem ? 'Todas las' : 'Todos los';
		return array(
			'name'               => ucfirst( $plur ),
			'singular_name'      => ucfirst( $sing ),
			'add_new'            => $nuevo,
			'add_new_item'       => "Añadir $sing",
			'edit_item'          => "Editar $sing",
			'new_item'           => "$nuevo $sing",
			'view_item'          => "Ver $sing",
			'search_items'       => "Buscar $plur",
			'not_found'          => 'No se han encontrado resultados',
			'not_found_in_trash' => 'Nada en la papelera',
			'all_items'          => "$todos $plur",
			'menu_name'          => ucfirst( $plur ),
		);
	}

	public static function register() {
		$public = array(
			'public'       => true,
			'show_in_menu' => 'pcof',
			'show_in_rest' => true,
			'supports'     => array( 'title', 'editor', 'excerpt', 'thumbnail', 'revisions' ),
			'menu_icon'    => 'dashicons-book-alt',
		);

		register_post_type( self::CAPITAL, array_merge( $public, array(
			'labels'      => self::labels( 'capital', 'capitales', true ),
			'rewrite'     => array( 'slug' => 'semana-santa', 'with_front' => false ),
			'has_archive' => false,
		) ) );
		register_post_type( self::HERMANDAD, array_merge( $public, array(
			'labels'      => self::labels( 'hermandad', 'hermandades', true ),
			'rewrite'     => array( 'slug' => 'hermandad', 'with_front' => false ),
			'has_archive' => false,
		) ) );
		register_post_type( self::BANDA, array_merge( $public, array(
			'labels'      => self::labels( 'banda', 'bandas', true ),
			'rewrite'     => array( 'slug' => 'banda', 'with_front' => false ),
			'has_archive' => false,
		) ) );
		register_post_type( self::IMAGINERO, array_merge( $public, array(
			'labels'      => self::labels( 'imaginero', 'imagineros' ),
			'rewrite'     => array( 'slug' => 'imaginero', 'with_front' => false ),
			'has_archive' => false,
		) ) );

		// Noticias agregadas: no tienen página propia, enlazan a la fuente original.
		register_post_type( self::NOTICIA, array(
			'labels'              => self::labels( 'noticia', 'noticias agregadas', true ),
			'public'              => false,
			'show_ui'             => true,
			'show_in_menu'        => 'pcof',
			'show_in_rest'        => false,
			'exclude_from_search' => true,
			'publicly_queryable'  => false,
			'supports'            => array( 'title', 'excerpt' ),
			'rewrite'             => false,
			'query_var'           => false,
		) );
		register_post_type( self::FUENTE, array(
			'labels'       => self::labels( 'fuente de noticias', 'fuentes de noticias', true ),
			'public'       => false,
			'show_ui'      => true,
			'show_in_menu' => 'pcof',
			'show_in_rest' => false,
			'supports'     => array( 'title' ),
			'rewrite'      => false,
			'query_var'    => false,
		) );

		$all = array( self::CAPITAL, self::HERMANDAD, self::BANDA, self::IMAGINERO, self::NOTICIA );
		register_taxonomy( self::TAX_CIUDAD, $all, array(
			'labels'            => array( 'name' => 'Capitales', 'singular_name' => 'Capital', 'menu_name' => 'Capitales (etiqueta)' ),
			'hierarchical'      => true,
			'public'            => true,
			'show_admin_column' => true,
			'show_in_rest'      => true,
			'show_in_menu'      => false,
			'rewrite'           => array( 'slug' => 'capital-cofrade', 'with_front' => false ),
		) );
		register_taxonomy( self::TAX_DIA, array( self::HERMANDAD ), array(
			'labels'            => array( 'name' => 'Días', 'singular_name' => 'Día', 'menu_name' => 'Días de la Semana Santa' ),
			'hierarchical'      => true,
			'public'            => true,
			'show_admin_column' => true,
			'show_in_rest'      => true,
			'show_in_menu'      => false,
			'rewrite'           => array( 'slug' => 'dia-cofrade', 'with_front' => false ),
		) );
		register_term_meta( self::TAX_DIA, 'pcof_orden', array( 'type' => 'integer', 'single' => true, 'show_in_rest' => false ) );
	}

	/** La búsqueda nativa del sitio incluye las fichas del portal. */
	public static function tweak_search( $q ) {
		if ( is_admin() || ! $q->is_main_query() || ! $q->is_search() ) {
			return;
		}
		$types = $q->get( 'post_type' );
		if ( empty( $types ) || 'any' === $types ) {
			$q->set( 'post_type', array_merge( array( 'post', 'page' ), self::public_types() ) );
		}
	}

	/* ------------------------- Campos ------------------------- */

	private static function fields( $type ) {
		switch ( $type ) {
			case self::CAPITAL:
				return array(
					'lema'  => array( 'Lema', 'text' ),
					'color' => array( 'Color de la capital (hex, ej. #5b2a86)', 'color' ),
					'slug'  => array( 'Clave de capital (no tocar)', 'text' ),
				);
			case self::HERMANDAD:
				return array(
					'nombre_oficial' => array( 'Nombre completo / oficial', 'text' ),
					'sede'      => array( 'Sede', 'text' ),
					'fundacion' => array( 'Fundación', 'text' ),
					'fuente_url' => array( 'Fuente de los datos (enlace)', 'url' ),
					'paso'      => array( 'Pasos y cortejo (resumen)', 'text' ),
					'musica'    => array( 'Acompañamiento musical (texto)', 'text' ),
					'web'       => array( 'Web oficial', 'url' ),
					'orden'     => array( 'Orden dentro del día', 'number' ),
					'bandas'    => array( 'Bandas vinculadas', 'bandas' ),
				);
			case self::BANDA:
				return array(
					'tipo'      => array( 'Tipo de formación', 'text' ),
					'localidad' => array( 'Localidad', 'text' ),
					'fundacion' => array( 'Fundación', 'text' ),
					'web'       => array( 'Web oficial', 'url' ),
				);
			case self::IMAGINERO:
				return array(
					'vida'    => array( 'Años de vida', 'text' ),
					'escuela' => array( 'Escuela / ámbito', 'text' ),
					'web'     => array( 'Enlace de referencia', 'url' ),
				);
			case self::FUENTE:
				return array(
					'feed'   => array( 'URL del feed RSS/Atom', 'url' ),
					'web'    => array( 'Web de la fuente (se usa para detectar el feed si dejas vacío el campo anterior)', 'url' ),
					'tipo'   => array( 'Tipo', 'tipo' ),
					'ciudad' => array( 'Capital por defecto', 'ciudad' ),
					'filtro' => array( 'Filtrar por temática cofrade (para portadas generalistas)', 'check' ),
					'activo' => array( 'Fuente activa', 'check' ),
				);
		}
		return array();
	}

	public static function add_meta_boxes() {
		foreach ( array( self::CAPITAL, self::HERMANDAD, self::BANDA, self::IMAGINERO, self::FUENTE ) as $t ) {
			add_meta_box( 'pcof_datos', 'Datos de la ficha', array( __CLASS__, 'box' ), $t, 'normal', 'high' );
		}
	}

	public static function box( $post ) {
		wp_nonce_field( 'pcof_save_' . $post->post_type, 'pcof_nonce' );
		$fields = self::fields( $post->post_type );
		echo '<table class="form-table" role="presentation"><tbody>';
		foreach ( $fields as $key => $def ) {
			$val = get_post_meta( $post->ID, '_pcof_' . $key, true );
			if ( self::FUENTE === $post->post_type && 'activo' === $key && '' === $val && 'auto-draft' === $post->post_status ) {
				$val = '1';
			}
			echo '<tr><th scope="row"><label for="pcof_f_' . esc_attr( $key ) . '">' . esc_html( $def[0] ) . '</label></th><td>';
			$name = 'pcof_f[' . esc_attr( $key ) . ']';
			$id   = 'pcof_f_' . esc_attr( $key );
			switch ( $def[1] ) {
				case 'check':
					echo '<input type="checkbox" id="' . $id . '" name="' . $name . '" value="1" ' . checked( '1', (string) $val, false ) . '>';
					break;
				case 'tipo':
					echo '<select id="' . $id . '" name="' . $name . '">';
					foreach ( array( 'agregador' => 'Agregador (Google Noticias…)', 'prensa' => 'Prensa', 'oficial' => 'Web oficial (hermandad, banda, consejo, diócesis)' ) as $v => $l ) {
						echo '<option value="' . esc_attr( $v ) . '" ' . selected( $v, $val, false ) . '>' . esc_html( $l ) . '</option>';
					}
					echo '</select>';
					break;
				case 'ciudad':
					echo '<select id="' . $id . '" name="' . $name . '"><option value="">— ninguna / detectar —</option>';
					foreach ( PCOF_Util::capitales() as $slug => $c ) {
						echo '<option value="' . esc_attr( $slug ) . '" ' . selected( $slug, $val, false ) . '>' . esc_html( $c['nombre'] ) . '</option>';
					}
					echo '</select>';
					break;
				case 'bandas':
					$sel   = is_array( $val ) ? $val : array();
					$bands = get_posts( array( 'post_type' => self::BANDA, 'numberposts' => -1, 'orderby' => 'title', 'order' => 'ASC', 'post_status' => 'publish', 'no_found_rows' => true ) );
					echo '<select multiple size="8" style="min-width:320px" id="' . $id . '" name="' . $name . '[]">';
					foreach ( $bands as $b ) {
						echo '<option value="' . esc_attr( $b->post_name ) . '" ' . selected( in_array( $b->post_name, $sel, true ), true, false ) . '>' . esc_html( $b->post_title ) . '</option>';
					}
					echo '</select><p class="description">Mantén Ctrl/Cmd para seleccionar varias.</p>';
					break;
				default:
					$type = in_array( $def[1], array( 'url', 'number' ), true ) ? $def[1] : 'text';
					echo '<input class="large-text" type="' . esc_attr( $type ) . '" id="' . $id . '" name="' . $name . '" value="' . esc_attr( is_array( $val ) ? '' : $val ) . '">';
			}
			echo '</td></tr>';
		}
		echo '</tbody></table>';
	}

	public static function save_meta( $post_id, $post ) {
		if ( ! isset( $_POST['pcof_nonce'], $_POST['pcof_f'] ) || ! is_array( $_POST['pcof_f'] ) ) {
			return;
		}
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['pcof_nonce'] ) ), 'pcof_save_' . $post->post_type ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$in = wp_unslash( $_POST['pcof_f'] );
		foreach ( self::fields( $post->post_type ) as $key => $def ) {
			$raw = isset( $in[ $key ] ) ? $in[ $key ] : '';
			if ( is_array( $raw ) && 'bandas' !== $def[1] ) {
				$raw = '';
			}
			switch ( $def[1] ) {
				case 'url':
					$val = esc_url_raw( (string) $raw );
					break;
				case 'number':
					$val = (string) absint( $raw );
					break;
				case 'check':
					$val = $raw ? '1' : '0';
					break;
				case 'color':
					$val = (string) sanitize_hex_color( (string) $raw );
					break;
				case 'bandas':
					$val = array_values( array_filter( array_map( 'sanitize_title', (array) $raw ) ) );
					break;
				case 'tipo':
					$val = in_array( $raw, array( 'agregador', 'prensa', 'oficial' ), true ) ? $raw : 'prensa';
					break;
				case 'ciudad':
					$val = isset( PCOF_Util::capitales()[ $raw ] ) ? $raw : '';
					break;
				default:
					$val = sanitize_text_field( (string) $raw );
			}
			update_post_meta( $post_id, '_pcof_' . $key, $val );
		}
		// Búsqueda interna: se regenera con cada guardado.
		if ( in_array( $post->post_type, array( self::HERMANDAD, self::BANDA, self::IMAGINERO ), true ) ) {
			PCOF_Importer::refresh_search_blob( $post_id );
		}
		if ( self::FUENTE === $post->post_type ) {
			$feed = get_post_meta( $post_id, '_pcof_feed', true );
			$web  = get_post_meta( $post_id, '_pcof_web', true );
			if ( ! $feed && $web ) {
				$found = PCOF_News::discover_feed( $web );
				if ( $found ) {
					update_post_meta( $post_id, '_pcof_feed', $found );
				}
			}
		}
	}

	/* ------------------------- Columnas ------------------------- */

	public static function columns_pcof_fuente( $cols ) {
		return array(
			'cb'     => $cols['cb'],
			'title'  => 'Fuente',
			'tipo'   => 'Tipo',
			'estado' => 'Último resultado',
			'nuevas' => 'Noticias nuevas (última vez)',
			'fecha'  => 'Última lectura',
		);
	}

	public static function columns_pcof_hermandad( $cols ) {
		$cols['orden'] = 'Orden';
		return $cols;
	}

	public static function column_content( $col, $post_id ) {
		switch ( $col ) {
			case 'tipo':
				echo esc_html( (string) get_post_meta( $post_id, '_pcof_tipo', true ) );
				break;
			case 'estado':
				$act = get_post_meta( $post_id, '_pcof_activo', true );
				$st  = (string) get_post_meta( $post_id, '_pcof_estado', true );
				echo '0' === $act ? '<em>Desactivada</em>' : esc_html( $st ? $st : 'Sin leer todavía' );
				break;
			case 'nuevas':
				echo esc_html( (string) get_post_meta( $post_id, '_pcof_nuevas', true ) );
				break;
			case 'fecha':
				$t = (int) get_post_meta( $post_id, '_pcof_ultima', true );
				echo $t ? esc_html( human_time_diff( $t ) . ' atrás' ) : '—';
				break;
			case 'orden':
				echo esc_html( (string) get_post_meta( $post_id, '_pcof_orden', true ) );
				break;
		}
	}
}
