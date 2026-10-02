<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Utilidades compartidas.
 */
class PCOF_Util {

	/** Minúsculas y sin acentos, para comparar y buscar. */
	public static function norm( $s ) {
		$s = remove_accents( (string) $s );
		return function_exists( 'mb_strtolower' ) ? mb_strtolower( $s, 'UTF-8' ) : strtolower( $s );
	}

	/** Ficha de las capitales: slug => [nombre, color]. */
	public static function capitales() {
		static $cache = null;
		if ( null !== $cache ) {
			return $cache;
		}
		$cache = array();
		$terms = get_terms( array( 'taxonomy' => PCOF_Types::TAX_CIUDAD, 'hide_empty' => false ) );
		if ( is_wp_error( $terms ) ) {
			return $cache;
		}
		foreach ( $terms as $t ) {
			$cache[ $t->slug ] = array( 'nombre' => $t->name, 'color' => '#5b2a86', 'id' => $t->term_id );
		}
		$posts = get_posts( array(
			'post_type' => PCOF_Types::CAPITAL, 'post_status' => 'publish', 'numberposts' => -1,
			'no_found_rows' => true,
		) );
		foreach ( $posts as $p ) {
			$slug = (string) get_post_meta( $p->ID, '_pcof_slug', true );
			if ( isset( $cache[ $slug ] ) ) {
				$color = sanitize_hex_color( (string) get_post_meta( $p->ID, '_pcof_color', true ) );
				$cache[ $slug ]['color']   = $color ? $color : '#5b2a86';
				$cache[ $slug ]['post_id'] = $p->ID;
			}
		}
		uasort( $cache, function ( $a, $b ) {
			return strcasecmp( remove_accents( $a['nombre'] ), remove_accents( $b['nombre'] ) );
		} );
		return $cache;
	}

	/** Días con su orden, solo los existentes. */
	public static function dias() {
		static $cache = null;
		if ( null !== $cache ) {
			return $cache;
		}
		$terms = get_terms( array( 'taxonomy' => PCOF_Types::TAX_DIA, 'hide_empty' => false ) );
		$cache = is_wp_error( $terms ) ? array() : $terms;
		usort( $cache, function ( $a, $b ) {
			return (int) get_term_meta( $a->term_id, 'pcof_orden', true ) <=> (int) get_term_meta( $b->term_id, 'pcof_orden', true );
		} );
		return $cache;
	}

	/** Primer término de una taxonomía para un post (o null). */
	public static function first_term( $post_id, $tax ) {
		$t = get_the_terms( $post_id, $tax );
		if ( is_wp_error( $t ) || empty( $t ) ) {
			return null;
		}
		return reset( $t );
	}

	/** Mapa clave de importación => ID de post publicado, por tipo. */
	public static function key_map( $post_type ) {
		static $maps = array();
		if ( isset( $maps[ $post_type ] ) ) {
			return $maps[ $post_type ];
		}
		global $wpdb;
		$rows = $wpdb->get_results( $wpdb->prepare(
			"SELECT pm.meta_value AS k, p.ID AS id FROM {$wpdb->postmeta} pm
			 INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
			 WHERE pm.meta_key = '_pcof_key' AND p.post_type = %s AND p.post_status = 'publish'",
			$post_type
		) );
		$maps[ $post_type ] = array();
		foreach ( (array) $rows as $r ) {
			$maps[ $post_type ][ $r->k ] = (int) $r->id;
		}
		return $maps[ $post_type ];
	}

	public static function link_by_key( $post_type, $key ) {
		$map = self::key_map( $post_type );
		return isset( $map[ $key ] ) ? get_permalink( $map[ $key ] ) : '';
	}

	public static function reset_caches() {
		delete_transient( 'pcof_counts' );
	}

	/** Contadores para el panel y la portada. */
	public static function counts() {
		$c = get_transient( 'pcof_counts' );
		if ( is_array( $c ) ) {
			return $c;
		}
		$c = array();
		foreach ( array(
			'capitales'   => PCOF_Types::CAPITAL,
			'hermandades' => PCOF_Types::HERMANDAD,
			'bandas'      => PCOF_Types::BANDA,
			'imagineros'  => PCOF_Types::IMAGINERO,
			'noticias'    => PCOF_Types::NOTICIA,
			'fuentes'     => PCOF_Types::FUENTE,
		) as $k => $type ) {
			$n = wp_count_posts( $type );
			$c[ $k ] = isset( $n->publish ) ? (int) $n->publish : 0;
		}
		set_transient( 'pcof_counts', $c, 10 * MINUTE_IN_SECONDS );
		return $c;
	}

	public static function opt( $name, $default = '' ) {
		$v = get_option( 'pcof_' . $name, null );
		return ( null === $v || '' === $v ) ? $default : $v;
	}
}
