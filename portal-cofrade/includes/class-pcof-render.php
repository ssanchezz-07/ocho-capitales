<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Presentación: fichas (vía the_content, válido para cualquier tema) y shortcodes.
 */
class PCOF_Render {

	private static $assets = false;

	public static function init() {
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'register_assets' ) );
		add_filter( 'the_content', array( __CLASS__, 'filter_content' ), 20 );
		add_shortcode( 'cofrade_portada', array( __CLASS__, 'sc_portada' ) );
		add_shortcode( 'cofrade_noticias', array( __CLASS__, 'sc_noticias' ) );
		add_shortcode( 'cofrade_capitales', array( __CLASS__, 'sc_capitales' ) );
		add_shortcode( 'cofrade_calendario', array( __CLASS__, 'sc_calendario' ) );
		add_shortcode( 'cofrade_directorio', array( __CLASS__, 'sc_directorio' ) );
		add_shortcode( 'cofrade_buscador', array( __CLASS__, 'sc_buscador' ) );
	}

	public static function register_assets() {
		wp_register_style( 'pcof', PCOF_URL . 'assets/portal.css', array(), PCOF_VERSION );
		wp_register_script( 'pcof', PCOF_URL . 'assets/portal.js', array(), PCOF_VERSION, true );
		$post = is_singular() ? get_post() : null;
		if ( is_singular( PCOF_Types::public_types() ) ) {
			self::enqueue();
		} elseif ( $post && preg_match( '/\[cofrade_/', (string) $post->post_content ) ) {
			self::enqueue(); // cargar en <head> evita el salto de estilos
		}
	}

	private static function enqueue() {
		wp_enqueue_style( 'pcof' );
		wp_enqueue_script( 'pcof' );
	}

	/* ------------------------- Piezas ------------------------- */

	private static function page_url( $key ) {
		$map = get_option( 'pcof_pages', array() );
		return ( is_array( $map ) && ! empty( $map[ $key ] ) ) ? get_permalink( $map[ $key ] ) : '';
	}

	private static function city_badge( $post_id ) {
		$out = '';
		$caps = PCOF_Util::capitales();
		$t    = get_the_terms( $post_id, PCOF_Types::TAX_CIUDAD );
		if ( $t && ! is_wp_error( $t ) ) {
			foreach ( $t as $term ) {
				$col  = isset( $caps[ $term->slug ] ) ? $caps[ $term->slug ]['color'] : '#5b2a86';
				$out .= '<span class="pcof-badge" style="--c:' . esc_attr( $col ) . '">' . esc_html( $term->name ) . '</span>';
			}
		}
		return $out;
	}

	private static function news_card( $p ) {
		$url = (string) get_post_meta( $p->ID, '_pcof_url', true );
		if ( ! $url ) {
			return '';
		}
		$img   = (string) get_post_meta( $p->ID, '_pcof_img', true );
		$src   = (string) get_post_meta( $p->ID, '_pcof_fuente', true );
		$when  = human_time_diff( get_post_time( 'U', true, $p ), time() );
		$h  = '<article class="pcof-card pcof-news">';
		if ( $img ) {
			$h .= '<a class="pcof-thumb" href="' . esc_url( $url ) . '" target="_blank" rel="nofollow noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="' . esc_url( $img ) . '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentNode.style.display=\'none\'"></a>';
		}
		$h .= '<div class="pcof-card-body"><div class="pcof-meta">' . self::city_badge( $p->ID ) . '<span>' . esc_html( $src ) . ' · hace ' . esc_html( $when ) . '</span></div>';
		$h .= '<h3><a href="' . esc_url( $url ) . '" target="_blank" rel="nofollow noopener noreferrer">' . esc_html( get_the_title( $p ) ) . '</a></h3>';
		if ( $p->post_excerpt ) {
			$h .= '<p>' . esc_html( $p->post_excerpt ) . '</p>';
		}
		$h .= '<a class="pcof-more" href="' . esc_url( $url ) . '" target="_blank" rel="nofollow noopener noreferrer">Leer en ' . esc_html( $src ? $src : 'la fuente' ) . ' ↗</a></div></article>';
		return $h;
	}

	/** Consulta de noticias. */
	public static function news_query( $args ) {
		$a = wp_parse_args( $args, array( 'ciudad' => '', 'q' => '', 'limite' => 12, 'pag' => 1 ) );
		$q = array(
			'post_type' => PCOF_Types::NOTICIA, 'post_status' => 'publish', 'posts_per_page' => max( 1, min( 60, (int) $a['limite'] ) ),
			'paged' => max( 1, (int) $a['pag'] ), 'orderby' => 'date', 'order' => 'DESC', 'ignore_sticky_posts' => true,
		);
		if ( $a['ciudad'] && isset( PCOF_Util::capitales()[ $a['ciudad'] ] ) ) {
			$q['tax_query'] = array( array( 'taxonomy' => PCOF_Types::TAX_CIUDAD, 'field' => 'slug', 'terms' => $a['ciudad'] ) );
		}
		if ( '' !== $a['q'] ) {
			$q['s'] = $a['q'];
		}
		return new WP_Query( $q );
	}

	private static function news_grid( $query ) {
		if ( ! $query->have_posts() ) {
			return '<p class="pcof-empty">Aún no hay noticias que mostrar. Vuelve en unas horas.</p>';
		}
		$h = '<div class="pcof-grid pcof-grid-news">';
		foreach ( $query->posts as $p ) {
			$h .= self::news_card( $p );
		}
		return $h . '</div>';
	}

	private static function entry_card( $p, $extra = '' ) {
		$type = $p->post_type;
		$sub  = '';
		if ( PCOF_Types::HERMANDAD === $type ) {
			$dia = PCOF_Util::first_term( $p->ID, PCOF_Types::TAX_DIA );
			$sub = ( $dia ? $dia->name : '' ) . ( get_post_meta( $p->ID, '_pcof_sede', true ) ? ' · ' . get_post_meta( $p->ID, '_pcof_sede', true ) : '' );
		} elseif ( PCOF_Types::BANDA === $type ) {
			$sub = trim( get_post_meta( $p->ID, '_pcof_tipo', true ) . ' ' . ( get_post_meta( $p->ID, '_pcof_localidad', true ) ? '· ' . get_post_meta( $p->ID, '_pcof_localidad', true ) : '' ) );
		} elseif ( PCOF_Types::IMAGINERO === $type ) {
			$sub = trim( get_post_meta( $p->ID, '_pcof_vida', true ) . ' ' . ( get_post_meta( $p->ID, '_pcof_escuela', true ) ? '· ' . get_post_meta( $p->ID, '_pcof_escuela', true ) : '' ) );
		}
		$im    = get_post_meta( $p->ID, '_pcof_imagen', true );
		$thumb = ( is_array( $im ) && ! empty( $im['src'] ) ) ? '<div class="pcof-thumb' . ( ! empty( $im['escudo'] ) ? ' is-escudo' : '' ) . '"><img src="' . esc_url( strtok( (string) $im['src'], '?' ) ) . '" alt="" loading="lazy" decoding="async"></div>' : '';
		return '<a class="pcof-card pcof-entry" href="' . esc_url( get_permalink( $p ) ) . '"' . $extra . '>' . $thumb . '<div class="pcof-card-body"><div class="pcof-meta">' . self::city_badge( $p->ID ) . '</div><h3>' . esc_html( get_the_title( $p ) ) . '</h3>' . ( $sub ? '<p>' . esc_html( $sub ) . '</p>' : '' ) . '</div></a>';
	}

	private static function section( $title, $inner, $id = '' ) {
		if ( '' === trim( $inner ) ) {
			return '';
		}
		return '<section class="pcof-section"' . ( $id ? ' id="' . esc_attr( $id ) . '"' : '' ) . '><h2>' . esc_html( $title ) . '</h2>' . $inner . '</section>';
	}

	private static function search_form( $action = '', $q = '' ) {
		$action = $action ? $action : self::page_url( 'buscar' );
		return '<form class="pcof-search" role="search" method="get" action="' . esc_url( $action ) . '"><label class="screen-reader-text" for="pcof-q">Buscar</label><input id="pcof-q" type="search" name="q" value="' . esc_attr( $q ) . '" placeholder="Busca una hermandad, banda, imaginero o imagen (p. ej. Gran Poder, Juan de Mesa…)"><button type="submit">Buscar</button></form>';
	}

	/* ------------------------- Fichas (the_content) ------------------------- */

	public static function filter_content( $content ) {
		if ( is_admin() || ! is_singular( PCOF_Types::public_types() ) || ! in_the_loop() || ! is_main_query() ) {
			return $content;
		}
		$post = get_post();
		if ( ! $post ) {
			return $content;
		}
		self::enqueue();
		switch ( $post->post_type ) {
			case PCOF_Types::CAPITAL:
				return self::render_capital( $post, $content );
			case PCOF_Types::HERMANDAD:
				return self::render_hermandad( $post, $content );
			case PCOF_Types::BANDA:
				return self::render_banda( $post, $content );
			case PCOF_Types::IMAGINERO:
				return self::render_imaginero( $post, $content );
		}
		return $content;
	}

	/** Imagen de Wikimedia Commons con su crédito (o cadena vacía). */
	private static function figure( $im, $alt ) {
		if ( ! is_array( $im ) || empty( $im['src'] ) ) {
			return '';
		}
		$src  = strtok( (string) $im['src'], '?' );
		$lic  = ! empty( $im['licurl'] ) ? '<a href="' . esc_url( $im['licurl'] ) . '" rel="license noopener" target="_blank">' . esc_html( $im['licencia'] ) . '</a>' : esc_html( (string) $im['licencia'] );
		$cred = 'Imagen: ' . esc_html( ! empty( $im['autor'] ) ? $im['autor'] : 'Wikimedia Commons' ) . ' · ' . $lic . ' · <a href="' . esc_url( (string) $im['pagina'] ) . '" target="_blank" rel="noopener">Wikimedia Commons</a>';
		return '<figure class="pcof-figure' . ( ! empty( $im['escudo'] ) ? ' is-escudo' : '' ) . '"><img src="' . esc_url( $src ) . '" alt="' . esc_attr( $alt ) . '" width="' . (int) $im['w'] . '" height="' . (int) $im['h'] . '" loading="lazy" decoding="async"><figcaption>' . $cred . '</figcaption></figure>';
	}

	private static function table( $head, $rows ) {
		if ( ! $rows ) {
			return '';
		}
		$h = '<div class="pcof-scroll"><table class="pcof-table"><thead><tr>';
		foreach ( $head as $c ) {
			$h .= '<th>' . esc_html( $c ) . '</th>';
		}
		$h .= '</tr></thead><tbody>';
		foreach ( $rows as $r ) {
			$h .= '<tr>';
			foreach ( $r as $c ) {
				$h .= '<td>' . esc_html( (string) $c ) . '</td>';
			}
			$h .= '</tr>';
		}
		return $h . '</tbody></table></div>';
	}

	private static function crumbs( $items ) {
		$h = '<nav class="pcof-crumbs" aria-label="Migas de pan">';
		$parts = array();
		foreach ( $items as $it ) {
			$parts[] = $it[1] ? '<a href="' . esc_url( $it[1] ) . '">' . esc_html( $it[0] ) . '</a>' : '<span>' . esc_html( $it[0] ) . '</span>';
		}
		return $h . implode( ' › ', $parts ) . '</nav>';
	}

	private static function facts( $rows ) {
		$h = '';
		foreach ( $rows as $r ) {
			if ( '' === trim( wp_strip_all_tags( (string) $r[1] ) ) ) {
				continue;
			}
			$h .= '<div><dt>' . esc_html( $r[0] ) . '</dt><dd>' . $r[1] . '</dd></div>';
		}
		return $h ? '<dl class="pcof-facts">' . $h . '</dl>' : '';
	}

	private static function chips( $links ) {
		if ( ! $links ) {
			return '';
		}
		$h = '<ul class="pcof-chips">';
		foreach ( $links as $l ) {
			$h .= '<li><a href="' . esc_url( $l[1] ) . '">' . esc_html( $l[0] ) . '</a></li>';
		}
		return $h . '</ul>';
	}

	private static function render_hermandad( $post, $content ) {
		$ciudad = PCOF_Util::first_term( $post->ID, PCOF_Types::TAX_CIUDAD );
		$dia    = PCOF_Util::first_term( $post->ID, PCOF_Types::TAX_DIA );
		$caps   = PCOF_Util::capitales();
		$cap_url = ( $ciudad && ! empty( $caps[ $ciudad->slug ]['post_id'] ) ) ? get_permalink( $caps[ $ciudad->slug ]['post_id'] ) : '';
		$color  = $ciudad && isset( $caps[ $ciudad->slug ] ) ? $caps[ $ciudad->slug ]['color'] : '#5b2a86';

		$h  = '<div class="pcof pcof-ficha" style="--pcof-accent:' . esc_attr( $color ) . '">';
		$h .= self::crumbs( array( array( 'Inicio', self::page_url( 'inicio' ) ), array( 'Hermandades', self::page_url( 'hermandades' ) ), array( $ciudad ? $ciudad->name : '', $cap_url ), array( get_the_title( $post ), '' ) ) );
		$web = (string) get_post_meta( $post->ID, '_pcof_web', true );
		$fuente = (string) get_post_meta( $post->ID, '_pcof_fuente_url', true );
		$h .= self::facts( array(
			array( 'Nombre completo', esc_html( (string) get_post_meta( $post->ID, '_pcof_nombre_oficial', true ) ) ),
			array( 'Capital', $ciudad ? ( $cap_url ? '<a href="' . esc_url( $cap_url ) . '">' . esc_html( $ciudad->name ) . '</a>' : esc_html( $ciudad->name ) ) : '' ),
			array( 'Día', $dia ? esc_html( $dia->name ) : '' ),
			array( 'Sede', esc_html( (string) get_post_meta( $post->ID, '_pcof_sede', true ) ) ),
			array( 'Fundación', esc_html( (string) get_post_meta( $post->ID, '_pcof_fundacion', true ) ) ),
			array( 'Web oficial', $web ? '<a href="' . esc_url( $web ) . '" rel="noopener" target="_blank">' . esc_html( wp_parse_url( $web, PHP_URL_HOST ) ) . '</a>' : '' ),
		) );
		$h .= self::figure( get_post_meta( $post->ID, '_pcof_imagen', true ), get_the_title( $post ) );
		$h .= '<div class="pcof-body">' . $content . '</div>';
		$mus = get_post_meta( $post->ID, '_pcof_musica_oficial', true );
		if ( is_array( $mus ) && $mus ) {
			$rows = array();
			foreach ( $mus as $m ) {
				$rows[] = array( $m['titular'], $m['banda'] );
			}
			$h .= self::section( 'Acompañamiento musical oficial 2026', self::table( array( 'Paso / titular', 'Formación' ), $rows ) );
		}
		$mar = get_post_meta( $post->ID, '_pcof_marchas', true );
		if ( is_array( $mar ) && $mar ) {
			$rows = array();
			foreach ( $mar as $m ) {
				$rows[] = array( $m['titulo'], $m['autor'], $m['anio'], $m['tipo'] );
			}
			$h .= self::section( 'Marchas dedicadas', self::table( array( 'Marcha', 'Compositor', 'Año', 'Formación' ), $rows ) );
		}

		// Bandas e imagineros vinculados
		$bands = array();
		foreach ( (array) get_post_meta( $post->ID, '_pcof_bandas', true ) as $slug ) {
			$b = get_page_by_path( $slug, OBJECT, PCOF_Types::BANDA );
			if ( $b && 'publish' === $b->post_status ) {
				$bands[] = array( get_the_title( $b ), get_permalink( $b ) );
			}
		}
		$imgs = array();
		foreach ( (array) get_post_meta( $post->ID, '_pcof_imagineros', true ) as $slug ) {
			$i = get_page_by_path( $slug, OBJECT, PCOF_Types::IMAGINERO );
			if ( $i && 'publish' === $i->post_status ) {
				$imgs[] = array( get_the_title( $i ), get_permalink( $i ) );
			}
		}
		if ( $fuente ) {
			$host = wp_parse_url( $fuente, PHP_URL_HOST );
			$lbl  = false !== strpos( (string) $host, 'wikipedia.org' ) ? 'artículo de Wikipedia (CC BY-SA 4.0)' : 'ficha oficial en ' . $host;
			$h   .= '<p class="pcof-note">Fuente de los datos: <a href="' . esc_url( $fuente ) . '" target="_blank" rel="noopener">' . esc_html( (string) $lbl ) . '</a>.</p>';
		}
		$h .= self::section( 'Bandas vinculadas', self::chips( $bands ) );
		$h .= self::section( 'Imagineros', self::chips( $imgs ) );
		if ( $ciudad ) {
			$h .= self::section( 'Últimas noticias de ' . $ciudad->name, self::news_grid( self::news_query( array( 'ciudad' => $ciudad->slug, 'limite' => 6 ) ) ) );
		}
		return $h . '</div>';
	}

	private static function render_banda( $post, $content ) {
		$slug = $post->post_name;
		$q    = new WP_Query( array(
			'post_type' => PCOF_Types::HERMANDAD, 'post_status' => 'publish', 'posts_per_page' => -1, 'no_found_rows' => true,
			'orderby' => 'title', 'order' => 'ASC',
			'meta_query' => array( array( 'key' => '_pcof_bandas', 'value' => '"' . $slug . '"', 'compare' => 'LIKE' ) ),
		) );
		$h  = '<div class="pcof pcof-ficha">';
		$h .= self::crumbs( array( array( 'Inicio', self::page_url( 'inicio' ) ), array( 'Bandas', self::page_url( 'bandas' ) ), array( get_the_title( $post ), '' ) ) );
		$web = (string) get_post_meta( $post->ID, '_pcof_web', true );
		$h .= self::facts( array(
			array( 'Tipo', esc_html( (string) get_post_meta( $post->ID, '_pcof_tipo', true ) ) ),
			array( 'Localidad', esc_html( (string) get_post_meta( $post->ID, '_pcof_localidad', true ) ) ),
			array( 'Fundación', esc_html( (string) get_post_meta( $post->ID, '_pcof_fundacion', true ) ) ),
			array( 'Web oficial', $web ? '<a href="' . esc_url( $web ) . '" rel="noopener" target="_blank">' . esc_html( wp_parse_url( $web, PHP_URL_HOST ) ) . '</a>' : '' ),
		) );
		$h .= '<div class="pcof-body">' . $content . '</div>';
		$links = array();
		foreach ( $q->posts as $p ) {
			$c = PCOF_Util::first_term( $p->ID, PCOF_Types::TAX_CIUDAD );
			$links[] = array( get_the_title( $p ) . ( $c ? ' (' . $c->name . ')' : '' ), get_permalink( $p ) );
		}
		$h .= self::section( 'Acompaña a', self::chips( $links ) );
		$h .= '<p class="pcof-note">Configuración musical según la última información recopilada; las hermandades la cambian con frecuencia de un año a otro.</p>';
		return $h . '</div>';
	}

	private static function render_imaginero( $post, $content ) {
		$h  = '<div class="pcof pcof-ficha">';
		$h .= self::crumbs( array( array( 'Inicio', self::page_url( 'inicio' ) ), array( 'Imagineros', self::page_url( 'imagineros' ) ), array( get_the_title( $post ), '' ) ) );
		$h .= self::facts( array(
			array( 'Años', esc_html( (string) get_post_meta( $post->ID, '_pcof_vida', true ) ) ),
			array( 'Escuela', esc_html( (string) get_post_meta( $post->ID, '_pcof_escuela', true ) ) ),
		) );
		$h .= '<div class="pcof-body">' . $content . '</div>';
		$obras = get_post_meta( $post->ID, '_pcof_obras', true );
		if ( is_array( $obras ) && $obras ) {
			$caps = PCOF_Util::capitales();
			$li   = '';
			foreach ( $obras as $o ) {
				$url  = PCOF_Util::link_by_key( PCOF_Types::HERMANDAD, 'h:' . $o['hermandad_slug'] );
				$ciu  = isset( $caps[ $o['ciudad'] ] ) ? $caps[ $o['ciudad'] ]['nombre'] : '';
				$hn   = $url ? '<a href="' . esc_url( $url ) . '">' . esc_html( $o['hermandad'] ) . '</a>' : esc_html( $o['hermandad'] );
				$det  = ! empty( $o['atrib'] ) ? ' <em>(atribución)</em>' : '';
				$li  .= '<li><strong>' . esc_html( $o['titular'] ) . '</strong> — ' . $hn . ( $ciu ? ' (' . esc_html( $ciu ) . ')' : '' ) . $det . ( $o['detalle'] ? '<br><small>' . esc_html( $o['detalle'] ) . '</small>' : '' ) . '</li>';
			}
			$h .= self::section( 'Obras en la Semana Santa andaluza', '<ul class="pcof-list">' . $li . '</ul>' );
		}
		return $h . '</div>';
	}

	private static function render_capital( $post, $content ) {
		$slug  = (string) get_post_meta( $post->ID, '_pcof_slug', true );
		$caps  = PCOF_Util::capitales();
		$color = isset( $caps[ $slug ] ) ? $caps[ $slug ]['color'] : '#5b2a86';
		$lema  = (string) get_post_meta( $post->ID, '_pcof_lema', true );

		$h  = '<div class="pcof pcof-ficha pcof-capital" style="--pcof-accent:' . esc_attr( $color ) . '">';
		$h .= self::crumbs( array( array( 'Inicio', self::page_url( 'inicio' ) ), array( 'Capitales', self::page_url( 'capitales' ) ), array( get_the_title( $post ), '' ) ) );
		if ( $lema ) {
			$h .= '<p class="pcof-lema">' . esc_html( $lema ) . '</p>';
		}
		$h .= self::figure( get_post_meta( $post->ID, '_pcof_imagen', true ), get_the_title( $post ) );
		$h .= '<div class="pcof-body">' . $content . '</div>';

		// Hermandades por día
		$herm = new WP_Query( array(
			'post_type' => PCOF_Types::HERMANDAD, 'post_status' => 'publish', 'posts_per_page' => -1, 'no_found_rows' => true,
			'meta_key' => '_pcof_orden', 'orderby' => 'meta_value_num', 'order' => 'ASC',
			'tax_query' => array( array( 'taxonomy' => PCOF_Types::TAX_CIUDAD, 'field' => 'slug', 'terms' => $slug ) ),
		) );
		$by_day = array();
		foreach ( $herm->posts as $p ) {
			$d = PCOF_Util::first_term( $p->ID, PCOF_Types::TAX_DIA );
			$by_day[ $d ? $d->slug : '_' ][] = $p;
		}
		$nav = '';
		$sec = '';
		foreach ( PCOF_Util::dias() as $d ) {
			if ( empty( $by_day[ $d->slug ] ) ) {
				continue;
			}
			$nav .= '<a href="#dia-' . esc_attr( $d->slug ) . '">' . esc_html( $d->name ) . '</a>';
			$cards = '';
			foreach ( $by_day[ $d->slug ] as $p ) {
				$cards .= self::entry_card( $p );
			}
			$sec .= '<section class="pcof-section" id="dia-' . esc_attr( $d->slug ) . '"><h2>' . esc_html( $d->name ) . ' <small>' . count( $by_day[ $d->slug ] ) . ( 1 === count( $by_day[ $d->slug ] ) ? ' hermandad' : ' hermandades' ) . '</small></h2><div class="pcof-grid">' . $cards . '</div></section>';
		}
		if ( $sec ) {
			$h .= '<h2 class="pcof-h2">Hermandades por día</h2><nav class="pcof-daynav" aria-label="Días">' . $nav . '</nav>' . $sec;
		}

		// Bandas e imagineros de la ciudad
		$tax = array( array( 'taxonomy' => PCOF_Types::TAX_CIUDAD, 'field' => 'slug', 'terms' => $slug ) );
		foreach ( array( array( PCOF_Types::BANDA, 'Bandas y música', 'bandas' ), array( PCOF_Types::IMAGINERO, 'Imagineros con obra en la ciudad', 'imagineros' ) ) as $def ) {
			$q = new WP_Query( array( 'post_type' => $def[0], 'post_status' => 'publish', 'posts_per_page' => -1, 'no_found_rows' => true, 'orderby' => 'title', 'order' => 'ASC', 'tax_query' => $tax ) );
			$links = array();
			foreach ( $q->posts as $p ) {
				$links[] = array( get_the_title( $p ), get_permalink( $p ) );
			}
			$h .= self::section( $def[1], self::chips( $links ) );
		}
		$h .= self::section( 'Últimas noticias', self::news_grid( self::news_query( array( 'ciudad' => $slug, 'limite' => 9 ) ) ) );
		return $h . '</div>';
	}

	/* ------------------------- Shortcodes ------------------------- */

	public static function sc_noticias( $atts ) {
		self::enqueue();
		$a = shortcode_atts( array( 'ciudad' => '', 'limite' => 12, 'filtros' => '0', 'paginar' => '0' ), $atts, 'cofrade_noticias' );
		$ciudad = sanitize_title( $a['ciudad'] );
		$q      = '';
		$pag    = 1;
		$filtros = '1' === (string) $a['filtros'];
		$paginar = '1' === (string) $a['paginar'];
		if ( $filtros ) {
			if ( isset( $_GET['ciudad'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
				$c = sanitize_title( wp_unslash( $_GET['ciudad'] ) ); // phpcs:ignore
				$ciudad = isset( PCOF_Util::capitales()[ $c ] ) ? $c : '';
			}
			if ( isset( $_GET['nq'] ) ) { // phpcs:ignore
				$q = sanitize_text_field( wp_unslash( $_GET['nq'] ) ); // phpcs:ignore
			}
		}
		if ( $paginar && isset( $_GET['pag'] ) ) { // phpcs:ignore
			$pag = max( 1, (int) $_GET['pag'] ); // phpcs:ignore
		}
		$query = self::news_query( array( 'ciudad' => $ciudad, 'q' => $q, 'limite' => $a['limite'], 'pag' => $pag ) );
		$h = '<div class="pcof pcof-noticias">';
		if ( $filtros ) {
			$h .= '<form class="pcof-filters" method="get"><input type="search" name="nq" value="' . esc_attr( $q ) . '" placeholder="Buscar en las noticias…" aria-label="Buscar en las noticias"><select name="ciudad" aria-label="Capital"><option value="">Todas las capitales</option>';
			foreach ( PCOF_Util::capitales() as $slug => $c ) {
				$h .= '<option value="' . esc_attr( $slug ) . '"' . selected( $slug, $ciudad, false ) . '>' . esc_html( $c['nombre'] ) . '</option>';
			}
			$h .= '</select><button type="submit">Filtrar</button></form>';
		}
		$h .= self::news_grid( $query );
		if ( $paginar && $query->max_num_pages > 1 ) {
			$base = remove_query_arg( 'pag' );
			$h .= '<nav class="pcof-pager" aria-label="Paginación">';
			if ( $pag > 1 ) {
				$h .= '<a href="' . esc_url( add_query_arg( 'pag', $pag - 1, $base ) ) . '">← Más recientes</a>';
			}
			$h .= '<span>Página ' . (int) $pag . ' de ' . (int) $query->max_num_pages . '</span>';
			if ( $pag < $query->max_num_pages ) {
				$h .= '<a href="' . esc_url( add_query_arg( 'pag', $pag + 1, $base ) ) . '">Anteriores →</a>';
			}
			$h .= '</nav>';
		}
		$h .= '<p class="pcof-note">Titulares y extractos de medios y webs oficiales; cada noticia enlaza a su fuente original.</p></div>';
		return $h;
	}

	public static function sc_capitales() {
		self::enqueue();
		$h = '<div class="pcof"><div class="pcof-grid pcof-grid-caps">';
		foreach ( PCOF_Util::capitales() as $slug => $c ) {
			if ( empty( $c['post_id'] ) ) {
				continue;
			}
			$lema = (string) get_post_meta( $c['post_id'], '_pcof_lema', true );
			$h   .= '<a class="pcof-card pcof-cap" style="--c:' . esc_attr( $c['color'] ) . '" href="' . esc_url( get_permalink( $c['post_id'] ) ) . '"><div class="pcof-card-body"><h3>' . esc_html( $c['nombre'] ) . '</h3><p>' . esc_html( $lema ) . '</p></div></a>';
		}
		return $h . '</div></div>';
	}

	public static function sc_calendario() {
		self::enqueue();
		$caps   = PCOF_Util::capitales();
		$ciudad = 'sevilla';
		if ( isset( $_GET['ciudad'] ) ) { // phpcs:ignore
			$c = sanitize_title( wp_unslash( $_GET['ciudad'] ) ); // phpcs:ignore
			if ( isset( $caps[ $c ] ) ) {
				$ciudad = $c;
			}
		}
		if ( ! isset( $caps[ $ciudad ] ) ) {
			$ciudad = (string) key( $caps );
		}
		$h = '<div class="pcof pcof-cal" style="--pcof-accent:' . esc_attr( $ciudad && isset( $caps[ $ciudad ] ) ? $caps[ $ciudad ]['color'] : '#5b2a86' ) . '"><nav class="pcof-tabs" aria-label="Capital">';
		foreach ( $caps as $slug => $c ) {
			$h .= '<a href="' . esc_url( add_query_arg( 'ciudad', $slug, remove_query_arg( 'ciudad' ) ) ) . '"' . ( $slug === $ciudad ? ' aria-current="page"' : '' ) . '>' . esc_html( $c['nombre'] ) . '</a>';
		}
		$h .= '</nav>';
		if ( $ciudad ) {
			$herm = new WP_Query( array(
				'post_type' => PCOF_Types::HERMANDAD, 'post_status' => 'publish', 'posts_per_page' => -1, 'no_found_rows' => true,
				'meta_key' => '_pcof_orden', 'orderby' => 'meta_value_num', 'order' => 'ASC',
				'tax_query' => array( array( 'taxonomy' => PCOF_Types::TAX_CIUDAD, 'field' => 'slug', 'terms' => $ciudad ) ),
			) );
			$by = array();
			foreach ( $herm->posts as $p ) {
				$d = PCOF_Util::first_term( $p->ID, PCOF_Types::TAX_DIA );
				$by[ $d ? $d->slug : '_' ][] = $p;
			}
			foreach ( PCOF_Util::dias() as $d ) {
				if ( empty( $by[ $d->slug ] ) ) {
					continue;
				}
				$li = '';
				foreach ( $by[ $d->slug ] as $p ) {
					$sede = (string) get_post_meta( $p->ID, '_pcof_sede', true );
					$li  .= '<li><a href="' . esc_url( get_permalink( $p ) ) . '">' . esc_html( get_the_title( $p ) ) . '</a>' . ( $sede ? ' <small>' . esc_html( $sede ) . '</small>' : '' ) . '</li>';
				}
				$h .= '<section class="pcof-section"><h2>' . esc_html( $d->name ) . '</h2><ol class="pcof-order">' . $li . '</ol></section>';
			}
			$h .= '<p class="pcof-note">El orden indicado es el de la última configuración documentada; consulta siempre el itinerario oficial de cada año.</p>';
		}
		return $h . '</div>';
	}

	public static function sc_directorio( $atts ) {
		self::enqueue();
		$a = shortcode_atts( array( 'tipo' => 'hermandad' ), $atts, 'cofrade_directorio' );
		$map = array( 'hermandad' => PCOF_Types::HERMANDAD, 'banda' => PCOF_Types::BANDA, 'imaginero' => PCOF_Types::IMAGINERO );
		$type = isset( $map[ $a['tipo'] ] ) ? $map[ $a['tipo'] ] : PCOF_Types::HERMANDAD;
		$posts = get_posts( array( 'post_type' => $type, 'post_status' => 'publish', 'numberposts' => -1, 'orderby' => 'title', 'order' => 'ASC', 'no_found_rows' => true ) );
		update_postmeta_cache( wp_list_pluck( $posts, 'ID' ) );
		$h  = '<div class="pcof pcof-dir" data-pcof-dir><div class="pcof-filters"><input type="search" data-f="q" placeholder="Filtrar por nombre, sede, titular, imaginero…" aria-label="Filtrar"><select data-f="ciudad" aria-label="Capital"><option value="">Todas las capitales</option>';
		foreach ( PCOF_Util::capitales() as $slug => $c ) {
			$h .= '<option value="' . esc_attr( $slug ) . '">' . esc_html( $c['nombre'] ) . '</option>';
		}
		$h .= '</select>';
		if ( PCOF_Types::HERMANDAD === $type ) {
			$h .= '<select data-f="dia" aria-label="Día"><option value="">Todos los días</option>';
			foreach ( PCOF_Util::dias() as $d ) {
				$h .= '<option value="' . esc_attr( $d->slug ) . '">' . esc_html( $d->name ) . '</option>';
			}
			$h .= '</select>';
		}
		$h .= '<span class="pcof-count" aria-live="polite"></span></div><div class="pcof-grid">';
		foreach ( $posts as $p ) {
			$c = PCOF_Util::first_term( $p->ID, PCOF_Types::TAX_CIUDAD );
			$allc = array();
			$t = get_the_terms( $p->ID, PCOF_Types::TAX_CIUDAD );
			if ( $t && ! is_wp_error( $t ) ) {
				$allc = wp_list_pluck( $t, 'slug' );
			}
			$d = PCOF_Types::HERMANDAD === $type ? PCOF_Util::first_term( $p->ID, PCOF_Types::TAX_DIA ) : null;
			$blob = (string) get_post_meta( $p->ID, '_pcof_busq', true );
			$extra = ' data-q="' . esc_attr( mb_substr( $blob, 0, 1500 ) ) . '" data-ciudad="' . esc_attr( implode( ' ', $allc ) ) . '"' . ( $d ? ' data-dia="' . esc_attr( $d->slug ) . '"' : '' );
			$h .= self::entry_card( $p, $extra );
		}
		$h .= '</div><p class="pcof-empty" hidden>Ningún resultado con esos filtros.</p></div>';
		return $h;
	}

	public static function sc_buscador() {
		self::enqueue();
		$q = isset( $_GET['q'] ) ? sanitize_text_field( wp_unslash( $_GET['q'] ) ) : ''; // phpcs:ignore
		$h = '<div class="pcof pcof-buscador">' . self::search_form( '', $q );
		if ( '' === $q ) {
			return $h . '</div>';
		}
		$labels = array(
			PCOF_Types::CAPITAL => 'Capitales', PCOF_Types::HERMANDAD => 'Hermandades',
			PCOF_Types::BANDA => 'Bandas', PCOF_Types::IMAGINERO => 'Imagineros',
		);
		$any = false;
		foreach ( $labels as $type => $label ) {
			$ids = array();
			$a   = new WP_Query( array( 'post_type' => $type, 'post_status' => 'publish', 's' => $q, 'posts_per_page' => 40, 'fields' => 'ids', 'no_found_rows' => true ) );
			$ids = array_merge( $ids, $a->posts );
			$b   = new WP_Query( array(
				'post_type' => $type, 'post_status' => 'publish', 'posts_per_page' => 40, 'fields' => 'ids', 'no_found_rows' => true,
				'meta_query' => array( 'relation' => 'OR',
					array( 'key' => '_pcof_busq', 'value' => PCOF_Util::norm( $q ), 'compare' => 'LIKE' ),
					array( 'key' => '_pcof_busq', 'value' => mb_strtolower( $q ), 'compare' => 'LIKE' ),
				),
			) );
			$ids = array_values( array_unique( array_merge( $ids, $b->posts ) ) );
			if ( ! $ids ) {
				continue;
			}
			$any   = true;
			$cards = '';
			foreach ( $ids as $id ) {
				$cards .= self::entry_card( get_post( $id ) );
			}
			$h .= self::section( $label . ' (' . count( $ids ) . ')', '<div class="pcof-grid">' . $cards . '</div>' );
		}
		$news = self::news_query( array( 'q' => $q, 'limite' => 9 ) );
		if ( $news->have_posts() ) {
			$any = true;
			$h  .= self::section( 'Noticias', self::news_grid( $news ) );
		}
		if ( ! $any ) {
			$h .= '<p class="pcof-empty">No hay resultados para «' . esc_html( $q ) . '». Prueba con otra palabra.</p>';
		}
		return $h . '</div>';
	}

	public static function sc_portada() {
		self::enqueue();
		$c   = PCOF_Util::counts();
		$h   = '<div class="pcof pcof-home"><header class="pcof-hero"><p class="pcof-kicker">Semana Santa de Andalucía</p><h2>Toda la información cofrade, en un solo sitio</h2><p>Noticias diarias de la prensa y de las webs oficiales, y la enciclopedia de las ocho capitales: hermandades, bandas e imagineros.</p>' . self::search_form() . '<ul class="pcof-stats"><li><strong>' . (int) $c['hermandades'] . '</strong> hermandades</li><li><strong>' . (int) $c['bandas'] . '</strong> bandas</li><li><strong>' . (int) $c['imagineros'] . '</strong> imagineros</li><li><strong>8</strong> capitales</li></ul></header>';
		$h  .= self::section( 'Última hora cofrade', self::news_grid( self::news_query( array( 'limite' => 9 ) ) ) . '<p><a class="pcof-btn" href="' . esc_url( self::page_url( 'noticias' ) ) . '">Ver todas las noticias</a></p>' );
		$h  .= '<section class="pcof-section"><h2>Las ocho capitales</h2>' . do_shortcode( '[cofrade_capitales]' ) . '</section>';
		$h  .= '<section class="pcof-section"><h2>Explora</h2><ul class="pcof-chips"><li><a href="' . esc_url( self::page_url( 'calendario' ) ) . '">Calendario por días</a></li><li><a href="' . esc_url( self::page_url( 'hermandades' ) ) . '">Hermandades</a></li><li><a href="' . esc_url( self::page_url( 'bandas' ) ) . '">Bandas</a></li><li><a href="' . esc_url( self::page_url( 'imagineros' ) ) . '">Imagineros</a></li></ul></section>';
		return $h . '</div>';
	}
}
