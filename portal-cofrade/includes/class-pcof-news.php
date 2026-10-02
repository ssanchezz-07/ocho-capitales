<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Agregador de noticias: lee feeds RSS/Atom y guarda titular, extracto corto, imagen y enlace a la fuente.
 * No copia el cuerpo de las noticias: cada tarjeta lleva al medio original con su crédito.
 */
class PCOF_News {

	const CRON_HOOK = 'pcof_cron_fetch';
	const UA        = 'Mozilla/5.0 (compatible; PortalCofrade/1.0; +https://wordpress.org)';

	const DEFAULT_KEYWORDS = "semana santa\ncofrad\nhermandad\ncostaler\ncornetas\nagrupacion musical\npalio\nsaeta\nprocesion\nimaginer\nbesamanos\nvia crucis\ncapataz\nmarcha procesional";

	public static function init() {
		add_filter( 'cron_schedules', array( __CLASS__, 'schedules' ) );
		add_action( self::CRON_HOOK, array( __CLASS__, 'run_cron' ) );
		add_action( 'init', array( __CLASS__, 'maybe_schedule' ) );
		add_action( 'update_option_pcof_interval', function () {
			PCOF_News::schedule( true );
		} );
	}

	public static function schedules( $s ) {
		$s['pcof_1h']  = array( 'interval' => HOUR_IN_SECONDS, 'display' => 'InfoCofrade: cada hora' );
		$s['pcof_3h']  = array( 'interval' => 3 * HOUR_IN_SECONDS, 'display' => 'InfoCofrade: cada 3 horas' );
		$s['pcof_6h']  = array( 'interval' => 6 * HOUR_IN_SECONDS, 'display' => 'InfoCofrade: cada 6 horas' );
		$s['pcof_12h'] = array( 'interval' => 12 * HOUR_IN_SECONDS, 'display' => 'InfoCofrade: cada 12 horas' );
		return $s;
	}

	private static function wanted_schedule() {
		$iv = (string) PCOF_Util::opt( 'interval', '3h' );
		return in_array( $iv, array( '1h', '3h', '6h', '12h' ), true ) ? 'pcof_' . $iv : 'pcof_3h';
	}

	public static function maybe_schedule() {
		if ( wp_get_schedule( self::CRON_HOOK ) !== self::wanted_schedule() ) {
			self::schedule( true );
		}
	}

	public static function schedule( $force = false ) {
		if ( $force ) {
			wp_clear_scheduled_hook( self::CRON_HOOK );
		}
		if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_event( time() + 120, self::wanted_schedule(), self::CRON_HOOK );
		}
	}

	public static function run_cron() {
		self::run_all( 45 );
		if ( (int) get_option( 'pcof_last_purge', 0 ) < time() - DAY_IN_SECONDS ) {
			self::purge();
			update_option( 'pcof_last_purge', time(), false );
		}
	}

	/** IDs de fuentes activas, la menos reciente primero. */
	public static function source_ids( $only_active = true ) {
		$ids = get_posts( array(
			'post_type' => PCOF_Types::FUENTE, 'post_status' => 'publish', 'numberposts' => -1,
			'fields' => 'ids', 'no_found_rows' => true,
		) );
		if ( $only_active ) {
			$ids = array_values( array_filter( $ids, function ( $id ) {
				return '0' !== get_post_meta( $id, '_pcof_activo', true );
			} ) );
		}
		usort( $ids, function ( $a, $b ) {
			return (int) get_post_meta( $a, '_pcof_ultima', true ) <=> (int) get_post_meta( $b, '_pcof_ultima', true );
		} );
		return $ids;
	}

	/** Lee fuentes hasta agotar el presupuesto de tiempo (segundos). */
	public static function run_all( $budget = 45 ) {
		$start = microtime( true );
		$total = 0;
		foreach ( self::source_ids() as $id ) {
			if ( microtime( true ) - $start > $budget ) {
				break;
			}
			$r      = self::fetch_source( $id );
			$total += (int) $r['nuevas'];
		}
		update_option( 'pcof_last_run', time(), false );
		PCOF_Util::reset_caches();
		return $total;
	}

	/**
	 * Lee una fuente. Devuelve ['ok'=>bool,'nuevas'=>int,'total'=>int,'msg'=>string].
	 */
	public static function fetch_source( $id ) {
		$id = (int) $id;
		$p  = get_post( $id );
		if ( ! $p || PCOF_Types::FUENTE !== $p->post_type ) {
			return array( 'ok' => false, 'nuevas' => 0, 'total' => 0, 'msg' => 'Fuente inexistente' );
		}
		$url = (string) get_post_meta( $id, '_pcof_feed', true );
		if ( ! $url ) {
			$web = (string) get_post_meta( $id, '_pcof_web', true );
			if ( $web ) {
				$url = self::discover_feed( $web );
				if ( $url ) {
					update_post_meta( $id, '_pcof_feed', $url );
				}
			}
		}
		if ( ! $url ) {
			return self::finish( $id, false, 0, 0, 'Sin URL de feed' );
		}

		$ttl = function () {
			return 300;
		};
		$ua  = function ( $feed ) {
			if ( is_object( $feed ) && method_exists( $feed, 'set_useragent' ) ) {
				$feed->set_useragent( PCOF_News::UA );
			}
		};
		add_filter( 'wp_feed_cache_transient_lifetime', $ttl );
		add_action( 'wp_feed_options', $ua );
		$feed = fetch_feed( $url );
		remove_filter( 'wp_feed_cache_transient_lifetime', $ttl );
		remove_action( 'wp_feed_options', $ua );

		if ( is_wp_error( $feed ) ) {
			return self::finish( $id, false, 0, 0, 'Error: ' . wp_strip_all_tags( $feed->get_error_message() ) );
		}

		$tipo      = (string) get_post_meta( $id, '_pcof_tipo', true );
		$filtro    = '1' === (string) get_post_meta( $id, '_pcof_filtro', true );
		$ciudad    = (string) get_post_meta( $id, '_pcof_ciudad', true );
		$nombre    = trim( preg_replace( '/\s*\(.*\)\s*$/u', '', $p->post_title ) );
		$retencion = (int) PCOF_Util::opt( 'retencion', 365 );
		$limit_ts  = $retencion > 0 ? time() - $retencion * DAY_IN_SECONDS : 0;

		$cands = array();
		foreach ( (array) $feed->get_items( 0, 60 ) as $it ) {
			$c = self::parse_item( $it, $tipo, $nombre );
			if ( ! $c ) {
				continue;
			}
			if ( $limit_ts && $c['ts'] < $limit_ts ) {
				continue;
			}
			if ( $filtro && ! self::matches_topic( $c['titulo'] . ' ' . $c['extracto'] ) ) {
				continue;
			}
			$cands[] = $c;
		}
		$total = count( $cands );
		$nuevas = self::insert_new( $cands, $id, $ciudad );
		return self::finish( $id, true, $nuevas, $total, '' );
	}

	private static function finish( $id, $ok, $nuevas, $total, $err ) {
		update_post_meta( $id, '_pcof_ultima', time() );
		update_post_meta( $id, '_pcof_nuevas', $nuevas );
		$msg = $ok ? sprintf( 'Correcto · %d nuevas de %d relevantes', $nuevas, $total ) : $err;
		update_post_meta( $id, '_pcof_estado', mb_substr( $msg, 0, 240 ) );
		return array( 'ok' => $ok, 'nuevas' => $nuevas, 'total' => $total, 'msg' => $msg );
	}

	private static function clean_text( $s ) {
		$s = html_entity_decode( wp_strip_all_tags( (string) $s ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		$s = preg_replace( '/\s*The post .{0,200}? first appeared on .*$/su', '', $s );
		return trim( preg_replace( '/\s+/u', ' ', $s ) );
	}

	private static function parse_item( $it, $tipo, $nombre_fuente ) {
		$link = esc_url_raw( (string) $it->get_permalink(), array( 'http', 'https' ) );
		if ( ! $link ) {
			return null;
		}
		$titulo = self::clean_text( $it->get_title() );
		if ( '' === $titulo ) {
			return null;
		}
		$fuente = $nombre_fuente;
		if ( 'agregador' === $tipo ) {
			$tags = $it->get_item_tags( '', 'source' );
			$sn   = ( is_array( $tags ) && ! empty( $tags[0]['data'] ) ) ? self::clean_text( $tags[0]['data'] ) : '';
			if ( $sn ) {
				$fuente = $sn;
				$suf    = ' - ' . $sn;
				if ( mb_substr( $titulo, -mb_strlen( $suf ) ) === $suf ) {
					$titulo = trim( mb_substr( $titulo, 0, mb_strlen( $titulo ) - mb_strlen( $suf ) ) );
				}
			} else {
				$fuente = 'Google Noticias';
			}
			$extracto = ''; // la descripción de Google Noticias solo repite el titular
		} else {
			$desc     = self::clean_text( $it->get_description() );
			if ( '' === $desc ) {
				$desc = self::clean_text( $it->get_content() );
			}
			$extracto = wp_trim_words( $desc, 42, '…' );
			if ( mb_strlen( $extracto ) > 320 ) {
				$extracto = mb_substr( $extracto, 0, 317 ) . '…';
			}
			if ( PCOF_Util::norm( $extracto ) === PCOF_Util::norm( $titulo ) ) {
				$extracto = '';
			}
		}

		$ts = $it->get_date( 'U' );
		$ts = $ts ? (int) $ts : time();
		if ( $ts > time() ) {
			$ts = time();
		}

		$img = '';
		if ( 'agregador' !== $tipo ) {
			foreach ( (array) $it->get_enclosures() as $enc ) {
				if ( ! is_object( $enc ) ) {
					continue;
				}
				$l = $enc->get_link();
				$t = (string) $enc->get_type();
				$m = (string) $enc->get_medium();
				if ( $l && ( 'image' === $m || 0 === strpos( $t, 'image/' ) ) ) {
					$img = $l;
					break;
				}
			}
			if ( ! $img ) {
				$th = $it->get_thumbnail();
				if ( is_array( $th ) && ! empty( $th['url'] ) ) {
					$img = $th['url'];
				}
			}
			if ( ! $img && preg_match( '/<img[^>]+src=["\']([^"\']+)["\']/i', html_entity_decode( (string) $it->get_content() ), $m ) ) {
				$img = $m[1];
			}
			$img = $img ? esc_url_raw( $img, array( 'http', 'https' ) ) : '';
		}

		return array(
			'titulo' => $titulo, 'extracto' => $extracto, 'url' => $link, 'fuente' => $fuente, 'ts' => $ts, 'img' => $img,
			'h' => md5( $link ),
			't' => md5( preg_replace( '/[^a-z0-9]+/', '', PCOF_Util::norm( $titulo ) ) . '|' . PCOF_Util::norm( $fuente ) ),
		);
	}

	public static function keywords() {
		$raw   = (string) PCOF_Util::opt( 'keywords', self::DEFAULT_KEYWORDS );
		$words = preg_split( '/[\r\n,]+/', $raw );
		$out   = array();
		foreach ( (array) $words as $w ) {
			$w = trim( PCOF_Util::norm( $w ) );
			if ( '' !== $w ) {
				$out[] = $w;
			}
		}
		return $out;
	}

	/** Palabras ambiguas: solo cuentan si no hay indicios de deporte, prisiones, etc. */
	const WEAK = array( 'nazaren', 'penitencia', 'cristo', 'dolorosa' );
	const NEG  = array( 'futbol', 'baloncesto', 'voleibol', 'balonmano', 'segunda b', 'primera rfef', 'liga ', 'jornada', 'penitenciari', 'prision', 'carcel', 'tenis', 'padel', 'rugby' );

	private static function matches_topic( $text ) {
		$text = PCOF_Util::norm( $text );
		foreach ( self::keywords() as $k ) {
			if ( false !== strpos( $text, $k ) ) {
				return true;
			}
		}
		foreach ( self::NEG as $n ) {
			if ( false !== strpos( $text, $n ) ) {
				return false;
			}
		}
		foreach ( self::WEAK as $w ) {
			if ( false !== strpos( $text, $w ) ) {
				return true;
			}
		}
		return false;
	}

	private static function detect_cities( $text ) {
		$text = ' ' . PCOF_Util::norm( $text ) . ' ';
		$out  = array();
		foreach ( PCOF_Util::capitales() as $slug => $c ) {
			if ( preg_match( '/\b' . preg_quote( $slug, '/' ) . '\b/', $text ) ) {
				$out[] = $slug;
			}
		}
		return $out;
	}

	private static function insert_new( $cands, $source_id, $default_city ) {
		global $wpdb;
		if ( ! $cands ) {
			return 0;
		}
		$hashes = array();
		foreach ( $cands as $c ) {
			$hashes[] = $c['h'];
			$hashes[] = $c['t'];
		}
		$hashes = array_values( array_unique( $hashes ) );
		$ph     = implode( ',', array_fill( 0, count( $hashes ), '%s' ) );
		$found  = $wpdb->get_col( $wpdb->prepare(
			"SELECT meta_value FROM {$wpdb->postmeta} WHERE meta_key IN ('_pcof_h','_pcof_t') AND meta_value IN ($ph)",
			$hashes
		) );
		$seen   = array_flip( (array) $found );
		$caps   = PCOF_Util::capitales();
		$n      = 0;
		foreach ( $cands as $c ) {
			if ( isset( $seen[ $c['h'] ] ) || isset( $seen[ $c['t'] ] ) ) {
				continue;
			}
			if ( $n >= 40 ) {
				break;
			}
			$cities = self::detect_cities( $c['titulo'] . ' ' . $c['extracto'] );
			if ( ! $cities && $default_city ) {
				$cities = array( $default_city );
			}
			$gmt  = gmdate( 'Y-m-d H:i:s', $c['ts'] );
			$id   = wp_insert_post( wp_slash( array(
				'post_type'     => PCOF_Types::NOTICIA,
				'post_status'   => 'publish',
				'post_title'    => $c['titulo'],
				'post_excerpt'  => $c['extracto'],
				'post_date_gmt' => $gmt,
				'post_date'     => get_date_from_gmt( $gmt ),
				'meta_input'    => array(
					'_pcof_url'       => $c['url'],
					'_pcof_fuente'    => $c['fuente'],
					'_pcof_fuente_id' => $source_id,
					'_pcof_img'       => $c['img'],
					'_pcof_h'         => $c['h'],
					'_pcof_t'         => $c['t'],
				),
			) ), true );
			if ( is_wp_error( $id ) || ! $id ) {
				continue;
			}
			$term_ids = array();
			foreach ( $cities as $slug ) {
				if ( isset( $caps[ $slug ] ) ) {
					$term_ids[] = (int) $caps[ $slug ]['id'];
				}
			}
			if ( $term_ids ) {
				wp_set_object_terms( $id, $term_ids, PCOF_Types::TAX_CIUDAD );
			}
			$seen[ $c['h'] ] = 1;
			$seen[ $c['t'] ] = 1;
			$n++;
		}
		return $n;
	}

	/** Borra noticias más antiguas que la retención configurada. */
	public static function purge() {
		$days = (int) PCOF_Util::opt( 'retencion', 365 );
		if ( $days <= 0 ) {
			return 0;
		}
		$ids = get_posts( array(
			'post_type' => PCOF_Types::NOTICIA, 'post_status' => 'any', 'numberposts' => 300, 'fields' => 'ids',
			'no_found_rows' => true, 'date_query' => array( array( 'before' => gmdate( 'Y-m-d', time() - $days * DAY_IN_SECONDS ), 'column' => 'post_date_gmt' ) ),
		) );
		foreach ( $ids as $id ) {
			wp_delete_post( $id, true );
		}
		return count( $ids );
	}

	/** Intenta localizar el feed RSS/Atom de una web. */
	public static function discover_feed( $url ) {
		$url = esc_url_raw( $url, array( 'http', 'https' ) );
		if ( ! $url ) {
			return '';
		}
		$args = array( 'timeout' => 12, 'user-agent' => self::UA, 'redirection' => 4 );
		$res  = wp_safe_remote_get( $url, $args );
		if ( ! is_wp_error( $res ) && 200 === (int) wp_remote_retrieve_response_code( $res ) ) {
			$body = (string) wp_remote_retrieve_body( $res );
			if ( preg_match( '/^\s*(<\?xml[^>]*>\s*)?<(rss|feed|rdf)/i', $body ) ) {
				return $url; // ya es un feed
			}
			if ( preg_match_all( '/<link\b[^>]*>/i', $body, $m ) ) {
				foreach ( $m[0] as $tag ) {
					if ( preg_match( '/type=["\']application\/(rss|atom)\+xml["\']/i', $tag ) && preg_match( '/href=["\']([^"\']+)["\']/i', $tag, $h ) ) {
						$href = html_entity_decode( $h[1] );
						return esc_url_raw( self::absolute( $href, $url ), array( 'http', 'https' ) );
					}
				}
			}
		}
		foreach ( array( '/feed/', '/rss/', '/feed', '/rss.xml', '/index.php/feed/' ) as $suffix ) {
			$cand = rtrim( $url, '/' ) . $suffix;
			$r    = wp_safe_remote_get( $cand, $args );
			if ( ! is_wp_error( $r ) && 200 === (int) wp_remote_retrieve_response_code( $r )
				&& preg_match( '/^\s*(<\?xml[^>]*>\s*)?<(rss|feed|rdf)/i', (string) wp_remote_retrieve_body( $r ) ) ) {
				return esc_url_raw( $cand, array( 'http', 'https' ) );
			}
		}
		return '';
	}

	private static function absolute( $href, $base ) {
		if ( preg_match( '#^https?://#i', $href ) ) {
			return $href;
		}
		$p = wp_parse_url( $base );
		if ( empty( $p['host'] ) ) {
			return $href;
		}
		$root = $p['scheme'] . '://' . $p['host'] . ( isset( $p['port'] ) ? ':' . $p['port'] : '' );
		if ( 0 === strpos( $href, '//' ) ) {
			return $p['scheme'] . ':' . $href;
		}
		if ( 0 === strpos( $href, '/' ) ) {
			return $root . $href;
		}
		return rtrim( $base, '/' ) . '/' . $href;
	}
}
