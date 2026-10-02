<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Carga (y recarga sin duplicar) los datos base: capitales, hermandades, bandas, imagineros,
 * fuentes de noticias y páginas del portal. Pensado para ejecutarse por tramos desde el panel.
 *
 * Idempotente: cada ficha lleva una clave interna (_pcof_key). Si una ficha ya fue editada a mano
 * (su título/contenido ya no coincide con lo importado) se respeta y no se sobrescribe.
 */
class PCOF_Importer {

	const FASES = array( 'terminos', 'capitales', 'hermandades', 'imagineros', 'bandas', 'fuentes', 'paginas', 'fin' );
	const CHUNK = 30;

	private static $data = null;

	public static function data() {
		if ( null === self::$data ) {
			$json       = file_get_contents( PCOF_DIR . 'data/portal.json' );
			self::$data = json_decode( (string) $json, true );
			if ( ! is_array( self::$data ) ) {
				self::$data = array( 'capitales' => array(), 'hermandades' => array(), 'bandas' => array(), 'imagineros' => array(), 'dias_orden' => array() );
			}
		}
		return self::$data;
	}

	/** Ejecuta un tramo. Devuelve el estado siguiente. */
	public static function step( $fase, $offset ) {
		if ( function_exists( 'set_time_limit' ) ) {
			@set_time_limit( 120 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors
		}
		wp_defer_term_counting( true );
		$msg  = '';
		$next = array( 'fase' => $fase, 'offset' => 0 );
		switch ( $fase ) {
			case 'terminos':
				$msg  = self::terminos();
				$next = array( 'fase' => 'capitales', 'offset' => 0 );
				break;
			case 'capitales':
				$msg  = self::capitales();
				$next = array( 'fase' => 'hermandades', 'offset' => 0 );
				break;
			case 'hermandades':
				$list  = self::data()['hermandades'];
				$slice = array_slice( $list, $offset, self::CHUNK );
				$res   = array( 'created' => 0, 'updated' => 0, 'kept' => 0 );
				foreach ( $slice as $h ) {
					$res[ self::hermandad( $h ) ]++;
				}
				$end  = $offset + count( $slice );
				$msg  = sprintf( 'Hermandades %d/%d', $end, count( $list ) );
				$next = ( $end >= count( $list ) ) ? array( 'fase' => 'imagineros', 'offset' => 0 ) : array( 'fase' => 'hermandades', 'offset' => $end );
				break;
			case 'imagineros':
				$list  = self::data()['imagineros'];
				$slice = array_slice( $list, $offset, self::CHUNK );
				foreach ( $slice as $i ) {
					self::imaginero( $i );
				}
				$end  = $offset + count( $slice );
				$msg  = sprintf( 'Imagineros %d/%d', $end, count( $list ) );
				$next = ( $end >= count( $list ) ) ? array( 'fase' => 'bandas', 'offset' => 0 ) : array( 'fase' => 'imagineros', 'offset' => $end );
				break;
			case 'bandas':
				$list  = self::data()['bandas'];
				$slice = array_slice( $list, $offset, self::CHUNK );
				foreach ( $slice as $b ) {
					self::banda( $b );
				}
				$end  = $offset + count( $slice );
				$msg  = sprintf( 'Bandas %d/%d', $end, count( $list ) );
				$next = ( $end >= count( $list ) ) ? array( 'fase' => 'fuentes', 'offset' => 0 ) : array( 'fase' => 'bandas', 'offset' => $end );
				break;
			case 'fuentes':
				$msg  = self::fuentes();
				$next = array( 'fase' => 'paginas', 'offset' => 0 );
				break;
			case 'paginas':
				$msg  = self::paginas();
				$next = array( 'fase' => 'fin', 'offset' => 0 );
				break;
			case 'fin':
				update_option( 'pcof_imported_version', PCOF_VERSION );
				PCOF_Types::register();
				flush_rewrite_rules();
				PCOF_Util::reset_caches();
				$msg  = 'Importación terminada.';
				$next = null;
				break;
		}
		wp_defer_term_counting( false );
		$idx = array_search( $fase, self::FASES, true );
		return array(
			'msg'  => $msg,
			'next' => $next,
			'pct'  => (int) round( 100 * ( (int) $idx + 1 ) / count( self::FASES ) ),
			'done' => null === $next,
		);
	}

	/* ------------------------- Fases ------------------------- */

	private static function terminos() {
		$d = self::data();
		foreach ( $d['capitales'] as $c ) {
			if ( ! term_exists( $c['slug'], PCOF_Types::TAX_CIUDAD ) ) {
				wp_insert_term( $c['nombre'], PCOF_Types::TAX_CIUDAD, array( 'slug' => $c['slug'] ) );
			}
		}
		foreach ( $d['dias_orden'] as $i => $label ) {
			$slug = sanitize_title( $label );
			$t    = term_exists( $slug, PCOF_Types::TAX_DIA );
			if ( ! $t ) {
				$t = wp_insert_term( $label, PCOF_Types::TAX_DIA, array( 'slug' => $slug ) );
			}
			if ( ! is_wp_error( $t ) ) {
				$tid = is_array( $t ) ? (int) $t['term_id'] : (int) $t;
				update_term_meta( $tid, 'pcof_orden', $i + 1 );
			}
		}
		return 'Capitales y días creados.';
	}

	private static function capitales() {
		$n = 0;
		foreach ( self::data()['capitales'] as $c ) {
			$html = '';
			foreach ( $c['intro'] as $p ) {
				$html .= '<p>' . esc_html( $p ) . "</p>\n";
			}
			if ( ! empty( $c['datos'] ) ) {
				$html .= "<h2>Datos clave</h2>\n<table class=\"pcof-datos\"><tbody>\n";
				foreach ( $c['datos'] as $row ) {
					$html .= '<tr><th scope="row">' . esc_html( $row[0] ) . '</th><td>' . esc_html( $row[1] ) . "</td></tr>\n";
				}
				$html .= "</tbody></table>\n";
			}
			if ( ! empty( $c['claves'] ) ) {
				$html .= "<h2>Imprescindibles</h2>\n<ul>\n";
				foreach ( $c['claves'] as $k ) {
					$html .= '<li>' . esc_html( $k ) . "</li>\n";
				}
				$html .= "</ul>\n";
			}
			$id = self::upsert( PCOF_Types::CAPITAL, 'c:' . $c['slug'], $c['slug'], 'Semana Santa en ' . $c['nombre'], $html, array(
				'_pcof_slug'  => $c['slug'],
				'_pcof_color' => $c['color'],
				'_pcof_lema'  => $c['lema'],
				'_pcof_dias'  => $c['dias'],
				'_pcof_imagen' => isset( $c['imagen'] ) && is_array( $c['imagen'] ) ? $c['imagen'] : '',
			), $c['lema'] );
			if ( $id['id'] ) {
				wp_set_object_terms( $id['id'], array( $c['slug'] ), PCOF_Types::TAX_CIUDAD );
				$n++;
			}
		}
		return "Capitales: $n.";
	}

	/** @return string created|updated|kept */
	private static function hermandad( $h ) {
		$ciudades = wp_list_pluck( self::data()['capitales'], 'nombre', 'slug' );
		$cn       = isset( $ciudades[ $h['ciudad'] ] ) ? $ciudades[ $h['ciudad'] ] : $h['ciudad'];
		$html     = '';
		if ( ! empty( $h['historia'] ) ) {
			$html .= '<p>' . esc_html( $h['historia'] ) . "</p>\n";
		} else {
			$html .= '<p>' . esc_html( sprintf( 'Hermandad de la Semana Santa de %s que procesiona el %s.', $cn, $h['dia'] ) ) . "</p>\n";
		}
		if ( ! empty( $h['titulares'] ) ) {
			$html .= "<h2>Titulares</h2>\n<ul>\n";
			foreach ( $h['titulares'] as $t ) {
				$html .= '<li><strong>' . esc_html( $t['nombre'] ) . '</strong>' . ( $t['autor'] ? ' — ' . esc_html( $t['autor'] ) : '' ) . "</li>\n";
			}
			$html .= "</ul>\n";
		}
		if ( ! empty( $h['paso'] ) ) {
			$html .= "<h2>Pasos y cortejo</h2>\n<p>" . esc_html( $h['paso'] ) . "</p>\n";
		}
		if ( ! empty( $h['musica'] ) ) {
			$html .= "<h2>Acompañamiento musical</h2>\n<p>" . esc_html( $h['musica'] ) . "</p>\n";
		}
		$imag = array();
		foreach ( $h['titulares'] as $t ) {
			if ( ! empty( $t['imaginero'] ) ) {
				$imag[] = sanitize_title( $t['imaginero'] );
			}
		}
		$res = self::upsert( PCOF_Types::HERMANDAD, 'h:' . $h['slug'], $h['slug'], $h['nombre'], $html, array(
			'_pcof_nombre_oficial' => isset( $h['nombre_oficial'] ) ? $h['nombre_oficial'] : '',
			'_pcof_fuente_url' => isset( $h['fuente_url'] ) ? esc_url_raw( $h['fuente_url'] ) : '',
			'_pcof_web'        => isset( $h['web'] ) ? esc_url_raw( $h['web'] ) : '',
			'_pcof_imagen'     => isset( $h['imagen'] ) && is_array( $h['imagen'] ) ? $h['imagen'] : '',
			'_pcof_marchas'    => isset( $h['marchas'] ) ? $h['marchas'] : array(),
			'_pcof_musica_oficial' => isset( $h['musica_oficial'] ) ? $h['musica_oficial'] : array(),
			'_pcof_sede'       => $h['sede'],
			'_pcof_fundacion'  => $h['fundacion'],
			'_pcof_paso'       => $h['paso'],
			'_pcof_musica'     => $h['musica'],
			'_pcof_orden'      => (int) $h['orden'],
			'_pcof_bandas'     => array_values( $h['bandas_slugs'] ),
			'_pcof_imagineros' => array_values( array_unique( $imag ) ),
		) );
		if ( $res['id'] && 'kept' !== $res['status'] ) {
			wp_set_object_terms( $res['id'], array( $h['ciudad'] ), PCOF_Types::TAX_CIUDAD );
			wp_set_object_terms( $res['id'], array( sanitize_title( $h['dia'] ) ), PCOF_Types::TAX_DIA );
			self::refresh_search_blob( $res['id'] );
		}
		return $res['status'];
	}

	private static function imaginero( $i ) {
		$html = $i['bio'] ? '<p>' . esc_html( $i['bio'] ) . "</p>\n" : '';
		if ( '' === $html ) {
			$html = '<p>' . esc_html( 'Imaginero con obra documentada en la Semana Santa andaluza.' ) . "</p>\n";
		}
		$res = self::upsert( PCOF_Types::IMAGINERO, 'i:' . $i['slug'], $i['slug'], $i['nombre'], $html, array(
			'_pcof_vida'    => $i['vida'],
			'_pcof_escuela' => $i['escuela'],
			'_pcof_obras'   => $i['obras'],
		) );
		if ( $res['id'] && 'kept' !== $res['status'] ) {
			wp_set_object_terms( $res['id'], $i['ciudades'], PCOF_Types::TAX_CIUDAD );
			self::refresh_search_blob( $res['id'] );
		}
	}

	private static function banda( $b ) {
		$loc  = $b['localidad'] ? ' de ' . $b['localidad'] : '';
		$html = '<p>' . esc_html( ucfirst( strtolower( $b['tipo'] ) ) . $loc . '.' ) . "</p>\n";
		$res  = self::upsert( PCOF_Types::BANDA, 'b:' . $b['slug'], $b['slug'], $b['nombre'], $html, array(
			'_pcof_tipo'      => $b['tipo'],
			'_pcof_localidad' => $b['localidad'],
		) );
		if ( $res['id'] && 'kept' !== $res['status'] ) {
			$cities = array();
			foreach ( $b['acompana'] as $a ) {
				$cities[] = $a['ciudad'];
			}
			wp_set_object_terms( $res['id'], array_values( array_unique( $cities ) ), PCOF_Types::TAX_CIUDAD );
			self::refresh_search_blob( $res['id'] );
		}
	}

	private static function fuentes() {
		$list = json_decode( (string) file_get_contents( PCOF_DIR . 'data/fuentes.json' ), true );
		$seeded = get_option( 'pcof_fuentes_urls', null );
		if ( ! is_array( $seeded ) ) {
			// Instalaciones anteriores: se consideran ya cargadas las fuentes existentes.
			$seeded = array();
			if ( get_option( 'pcof_fuentes_seeded' ) ) {
				foreach ( get_posts( array( 'post_type' => PCOF_Types::FUENTE, 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids' ) ) as $fid ) {
					$u = (string) get_post_meta( $fid, '_pcof_feed', true );
					if ( $u ) {
						$seeded[] = $u;
					}
				}
				foreach ( (array) $list as $f ) { // las que ya venían de serie y el usuario borró, no se recrean
					if ( ! empty( $f['legacy'] ) ) {
						$seeded[] = esc_url_raw( $f['url'] );
					}
				}
			}
		}
		$n = 0;
		foreach ( (array) $list as $f ) {
			$url = esc_url_raw( $f['url'] );
			if ( in_array( $url, $seeded, true ) ) {
				continue;
			}
			$id = wp_insert_post( wp_slash( array(
				'post_type'   => PCOF_Types::FUENTE,
				'post_status' => 'publish',
				'post_title'  => $f['nombre'],
			) ), true );
			if ( is_wp_error( $id ) ) {
				continue;
			}
			update_post_meta( $id, '_pcof_feed', $url );
			update_post_meta( $id, '_pcof_tipo', $f['tipo'] );
			update_post_meta( $id, '_pcof_filtro', $f['filtro'] ? '1' : '0' );
			update_post_meta( $id, '_pcof_ciudad', $f['ciudad'] );
			update_post_meta( $id, '_pcof_activo', '1' );
			$seeded[] = $url;
			$n++;
		}
		update_option( 'pcof_fuentes_urls', array_values( array_unique( $seeded ) ), false );
		update_option( 'pcof_fuentes_seeded', 1 );
		return "Fuentes de noticias nuevas: $n.";
	}

	public static function pagina_defs() {
		return array(
			'inicio'      => array( 'InfoCofrade', 'infocofrade', '[cofrade_portada]' ),
			'noticias'    => array( 'Noticias cofrades', 'noticias-cofrades', '[cofrade_noticias filtros="1" paginar="1" limite="18"]' ),
			'capitales'   => array( 'Capitales', 'capitales-cofrades', '[cofrade_capitales]' ),
			'calendario'  => array( 'Calendario de hermandades', 'calendario-cofrade', '[cofrade_calendario]' ),
			'hermandades' => array( 'Hermandades', 'hermandades-cofrades', '[cofrade_directorio tipo="hermandad"]' ),
			'bandas'      => array( 'Bandas', 'bandas-cofrades', '[cofrade_directorio tipo="banda"]' ),
			'imagineros'  => array( 'Imagineros', 'imagineros-cofrades', '[cofrade_directorio tipo="imaginero"]' ),
			'buscar'      => array( 'Buscar en el portal', 'buscar-cofrade', '[cofrade_buscador]' ),
		);
	}

	private static function paginas() {
		$map = get_option( 'pcof_pages', array() );
		if ( ! is_array( $map ) ) {
			$map = array();
		}
		$created = 0;
		foreach ( self::pagina_defs() as $key => $def ) {
			if ( ! empty( $map[ $key ] ) && 'publish' === get_post_status( $map[ $key ] ) ) {
				continue;
			}
			$id = wp_insert_post( wp_slash( array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_title'   => $def[0],
				'post_name'    => $def[1],
				'post_content' => $def[2],
			) ), true );
			if ( ! is_wp_error( $id ) ) {
				$map[ $key ] = $id;
				$created++;
			}
		}
		update_option( 'pcof_pages', $map );
		self::menu( $map );
		return "Páginas del portal: $created nuevas.";
	}

	private static function menu( $map ) {
		$name = 'InfoCofrade';
		$menu = wp_get_nav_menu_object( $name );
		if ( $menu ) {
			return; // no se reescribe un menú que pueda haber personalizado el usuario
		}
		$menu_id = wp_create_nav_menu( $name );
		if ( is_wp_error( $menu_id ) ) {
			return;
		}
		foreach ( array( 'inicio', 'noticias', 'capitales', 'calendario', 'hermandades', 'bandas', 'imagineros', 'buscar' ) as $key ) {
			if ( empty( $map[ $key ] ) ) {
				continue;
			}
			wp_update_nav_menu_item( $menu_id, 0, array(
				'menu-item-title'     => get_the_title( $map[ $key ] ),
				'menu-item-object'    => 'page',
				'menu-item-object-id' => $map[ $key ],
				'menu-item-type'      => 'post_type',
				'menu-item-status'    => 'publish',
			) );
		}
		$locs = get_registered_nav_menus();
		if ( $locs ) {
			$assigned = get_nav_menu_locations();
			$first    = key( $locs );
			if ( empty( $assigned[ $first ] ) ) {
				$assigned[ $first ] = $menu_id;
				set_theme_mod( 'nav_menu_locations', $assigned );
			}
		}
	}

	/* ------------------------- Núcleo ------------------------- */

	/**
	 * Crea o actualiza una ficha por clave. No pisa lo editado a mano.
	 *
	 * @return array{id:int,status:string}
	 */
	private static function upsert( $type, $key, $slug, $title, $content, $meta, $excerpt = '' ) {
		global $wpdb;
		$existing = (int) $wpdb->get_var( $wpdb->prepare(
			"SELECT pm.post_id FROM {$wpdb->postmeta} pm INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
			 WHERE pm.meta_key = '_pcof_key' AND pm.meta_value = %s AND p.post_type = %s AND p.post_status <> 'trash' LIMIT 1",
			$key, $type
		) );

		$status = 'created';
		if ( $existing ) {
			$post   = get_post( $existing );
			$stored = (string) get_post_meta( $existing, '_pcof_hash', true );
			if ( $stored && md5( $post->post_title . '|' . $post->post_content ) !== $stored ) {
				return array( 'id' => $existing, 'status' => 'kept' );
			}
			$id = wp_update_post( wp_slash( array(
				'ID' => $existing, 'post_title' => $title, 'post_content' => $content, 'post_excerpt' => $excerpt,
			) ), true );
			$status = 'updated';
		} else {
			$id = wp_insert_post( wp_slash( array(
				'post_type' => $type, 'post_status' => 'publish', 'post_title' => $title, 'post_name' => $slug,
				'post_content' => $content, 'post_excerpt' => $excerpt,
			) ), true );
		}
		if ( is_wp_error( $id ) || ! $id ) {
			return array( 'id' => 0, 'status' => 'kept' );
		}
		update_post_meta( $id, '_pcof_key', $key );
		foreach ( $meta as $k => $v ) {
			update_post_meta( $id, $k, $v );
		}
		$saved = get_post( $id );
		update_post_meta( $id, '_pcof_hash', md5( $saved->post_title . '|' . $saved->post_content ) );
		return array( 'id' => (int) $id, 'status' => $status );
	}

	/** Texto de búsqueda interna (con y sin acentos). */
	public static function refresh_search_blob( $post_id ) {
		$post = get_post( $post_id );
		if ( ! $post ) {
			return;
		}
		$parts = array( $post->post_title, wp_strip_all_tags( $post->post_content ) );
		foreach ( array( PCOF_Types::TAX_CIUDAD, PCOF_Types::TAX_DIA ) as $tax ) {
			$terms = get_the_terms( $post_id, $tax );
			if ( $terms && ! is_wp_error( $terms ) ) {
				$parts[] = implode( ' ', wp_list_pluck( $terms, 'name' ) );
			}
		}
		foreach ( array( '_pcof_sede', '_pcof_localidad', '_pcof_tipo', '_pcof_escuela' ) as $mk ) {
			$parts[] = (string) get_post_meta( $post_id, $mk, true );
		}
		$obras = get_post_meta( $post_id, '_pcof_obras', true );
		if ( is_array( $obras ) ) {
			foreach ( $obras as $o ) {
				$parts[] = $o['titular'] . ' ' . $o['hermandad'];
			}
		}
		$text = trim( preg_replace( '/\s+/', ' ', implode( ' ', $parts ) ) );
		$text = function_exists( 'mb_strtolower' ) ? mb_strtolower( $text, 'UTF-8' ) : strtolower( $text );
		$blob = $text . ' ' . remove_accents( $text );
		update_post_meta( $post_id, '_pcof_busq', mb_substr( $blob, 0, 6000 ) );
	}
}
