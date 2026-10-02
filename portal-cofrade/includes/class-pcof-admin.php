<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Panel de administración: importación por tramos, lectura de noticias, ajustes y estado de fuentes.
 */
class PCOF_Admin {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ), 9 );
		add_action( 'admin_init', array( __CLASS__, 'settings' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'assets' ) );
		add_action( 'wp_ajax_pcof_import_step', array( __CLASS__, 'ajax_import' ) );
		add_action( 'wp_ajax_pcof_fetch_source', array( __CLASS__, 'ajax_fetch' ) );
		add_action( 'admin_post_pcof_set_front', array( __CLASS__, 'set_front' ) );
	}

	public static function menu() {
		add_menu_page( 'InfoCofrade', 'InfoCofrade', 'edit_posts', 'pcof', array( __CLASS__, 'panel' ), 'dashicons-groups', 26 );
		add_submenu_page( 'pcof', 'Panel del portal', 'Panel', 'manage_options', 'pcof', array( __CLASS__, 'panel' ), 0 );
	}

	public static function settings() {
		register_setting( 'pcof_group', 'pcof_interval', array( 'type' => 'string', 'sanitize_callback' => function ( $v ) {
			return in_array( $v, array( '1h', '3h', '6h', '12h' ), true ) ? $v : '3h';
		}, 'default' => '3h' ) );
		register_setting( 'pcof_group', 'pcof_retencion', array( 'type' => 'integer', 'sanitize_callback' => function ( $v ) {
			return max( 0, min( 3650, (int) $v ) );
		}, 'default' => 365 ) );
		register_setting( 'pcof_group', 'pcof_keywords', array( 'type' => 'string', 'sanitize_callback' => 'sanitize_textarea_field', 'default' => PCOF_News::DEFAULT_KEYWORDS ) );
	}

	public static function assets( $hook ) {
		if ( 'toplevel_page_pcof' !== $hook ) {
			return;
		}
		wp_enqueue_script( 'pcof-admin', PCOF_URL . 'assets/admin.js', array(), PCOF_VERSION, true );
		wp_localize_script( 'pcof-admin', 'PCOF', array(
			'ajax'    => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'pcof_admin' ),
			'sources' => PCOF_News::source_ids(),
			'auto'    => (bool) get_transient( 'pcof_autoimport' ),
		) );
		wp_add_inline_style( 'common', '.pcof-log{background:#1d2327;color:#c3c4c7;font:12px/1.6 monospace;padding:12px;max-height:260px;overflow:auto;border-radius:4px;margin-top:10px;display:none}.pcof-bar{height:8px;background:#dcdcde;border-radius:4px;overflow:hidden;margin-top:10px;display:none}.pcof-bar i{display:block;height:100%;width:0;background:#5b2a86;transition:width .3s}.pcof-cards{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}.pcof-cards div{background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:12px 18px;min-width:120px}.pcof-cards strong{display:block;font-size:26px;line-height:1.1}' );
	}

	public static function ajax_import() {
		check_ajax_referer( 'pcof_admin', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'msg' => 'Permisos insuficientes' ), 403 );
		}
		$fase = isset( $_POST['fase'] ) ? sanitize_key( wp_unslash( $_POST['fase'] ) ) : 'terminos';
		if ( ! in_array( $fase, PCOF_Importer::FASES, true ) ) {
			$fase = 'terminos';
		}
		$offset = isset( $_POST['offset'] ) ? max( 0, (int) $_POST['offset'] ) : 0;
		delete_transient( 'pcof_autoimport' );
		try {
			wp_send_json_success( PCOF_Importer::step( $fase, $offset ) );
		} catch ( Throwable $e ) {
			wp_send_json_error( array( 'msg' => $e->getMessage() ), 500 );
		}
	}

	public static function ajax_fetch() {
		check_ajax_referer( 'pcof_admin', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'msg' => 'Permisos insuficientes' ), 403 );
		}
		$id = isset( $_POST['id'] ) ? (int) $_POST['id'] : 0;
		if ( ! $id ) {
			PCOF_Util::reset_caches();
			wp_send_json_success( array( 'fin' => true ) );
		}
		@set_time_limit( 90 ); // phpcs:ignore
		$r          = PCOF_News::fetch_source( $id );
		$r['titulo'] = get_the_title( $id );
		wp_send_json_success( $r );
	}

	public static function set_front() {
		check_admin_referer( 'pcof_front' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Permisos insuficientes' );
		}
		$map = get_option( 'pcof_pages', array() );
		if ( ! empty( $map['inicio'] ) ) {
			update_option( 'show_on_front', 'page' );
			update_option( 'page_on_front', (int) $map['inicio'] );
		}
		wp_safe_redirect( admin_url( 'admin.php?page=pcof&front=1' ) );
		exit;
	}

	public static function panel() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Permisos insuficientes' );
		}
		$c        = PCOF_Util::counts();
		$imported = get_option( 'pcof_imported_version' );
		$last     = (int) get_option( 'pcof_last_run', 0 );
		$next     = wp_next_scheduled( PCOF_News::CRON_HOOK );
		$pages    = get_option( 'pcof_pages', array() );
		?>
		<div class="wrap">
			<h1>InfoCofrade</h1>
			<?php if ( isset( $_GET['front'] ) ) : // phpcs:ignore ?>
				<div class="notice notice-success is-dismissible"><p>La página «InfoCofrade» es ahora la portada del sitio.</p></div>
			<?php endif; ?>

			<div class="pcof-cards">
				<div><strong><?php echo (int) $c['hermandades']; ?></strong>hermandades</div>
				<div><strong><?php echo (int) $c['bandas']; ?></strong>bandas</div>
				<div><strong><?php echo (int) $c['imagineros']; ?></strong>imagineros</div>
				<div><strong><?php echo (int) $c['capitales']; ?></strong>capitales</div>
				<div><strong><?php echo (int) $c['noticias']; ?></strong>noticias</div>
				<div><strong><?php echo (int) $c['fuentes']; ?></strong>fuentes</div>
			</div>

			<h2>1 · Datos base</h2>
			<p><?php echo $imported ? 'Versión importada: ' . esc_html( $imported ) . '.' : '<strong>Aún no se han importado los datos.</strong>'; ?>
				Crea o actualiza capitales, hermandades, bandas, imagineros, fuentes y páginas. Es seguro repetirlo: no duplica y respeta lo que hayas editado a mano.</p>
			<p><button class="button button-primary" id="pcof-import"><?php echo $imported ? 'Volver a importar / actualizar' : 'Importar datos base'; ?></button></p>

			<h2>2 · Noticias</h2>
			<p>Última lectura: <?php echo $last ? esc_html( human_time_diff( $last ) ) . ' atrás' : 'nunca'; ?>.
				Próxima automática: <?php echo $next ? esc_html( human_time_diff( $next ) ) . ' (si el sitio recibe visitas; ver guía para un cron real)' : 'sin programar'; ?>.</p>
			<p><button class="button button-secondary" id="pcof-fetch">Actualizar noticias ahora</button>
				<a class="button" href="<?php echo esc_url( admin_url( 'edit.php?post_type=' . PCOF_Types::FUENTE ) ); ?>">Gestionar fuentes</a></p>

			<div class="pcof-bar" id="pcof-bar"><i></i></div>
			<div class="pcof-log" id="pcof-log" aria-live="polite"></div>

			<h2>3 · Portada del sitio</h2>
			<?php if ( ! empty( $pages['inicio'] ) ) : ?>
				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
					<input type="hidden" name="action" value="pcof_set_front">
					<?php wp_nonce_field( 'pcof_front' ); ?>
					<p><button class="button">Usar «InfoCofrade» como página de inicio</button>
						<a href="<?php echo esc_url( get_permalink( $pages['inicio'] ) ); ?>" target="_blank" rel="noopener">Ver portada</a></p>
				</form>
			<?php else : ?>
				<p>Disponible tras importar los datos.</p>
			<?php endif; ?>

			<h2>Ajustes</h2>
			<form method="post" action="options.php">
				<?php settings_fields( 'pcof_group' ); ?>
				<table class="form-table" role="presentation">
					<tr><th scope="row"><label for="pcof_interval">Frecuencia de lectura</label></th><td>
						<select id="pcof_interval" name="pcof_interval">
							<?php foreach ( array( '1h' => 'Cada hora', '3h' => 'Cada 3 horas', '6h' => 'Cada 6 horas', '12h' => 'Cada 12 horas' ) as $v => $l ) : ?>
								<option value="<?php echo esc_attr( $v ); ?>" <?php selected( $v, PCOF_Util::opt( 'interval', '3h' ) ); ?>><?php echo esc_html( $l ); ?></option>
							<?php endforeach; ?>
						</select></td></tr>
					<tr><th scope="row"><label for="pcof_retencion">Conservar noticias (días)</label></th><td>
						<input type="number" min="0" max="3650" id="pcof_retencion" name="pcof_retencion" value="<?php echo esc_attr( PCOF_Util::opt( 'retencion', 365 ) ); ?>">
						<p class="description">0 = no borrar nunca.</p></td></tr>
					<tr><th scope="row"><label for="pcof_keywords">Palabras clave cofrades</label></th><td>
						<textarea id="pcof_keywords" name="pcof_keywords" rows="8" cols="40"><?php echo esc_textarea( PCOF_Util::opt( 'keywords', PCOF_News::DEFAULT_KEYWORDS ) ); ?></textarea>
						<p class="description">Una por línea. Sin acentos y en minúsculas. Solo se aplican a las fuentes con «Filtrar por temática» activado (portadas de periódicos).</p></td></tr>
				</table>
				<?php submit_button( 'Guardar ajustes' ); ?>
			</form>

			<h2>Estado de las fuentes</h2>
			<table class="widefat striped"><thead><tr><th>Fuente</th><th>Tipo</th><th>Resultado</th><th>Última lectura</th></tr></thead><tbody>
			<?php foreach ( PCOF_News::source_ids( false ) as $sid ) : ?>
				<tr>
					<td><a href="<?php echo esc_url( get_edit_post_link( $sid ) ); ?>"><?php echo esc_html( get_the_title( $sid ) ); ?></a></td>
					<td><?php echo esc_html( (string) get_post_meta( $sid, '_pcof_tipo', true ) ); ?></td>
					<td><?php echo '0' === get_post_meta( $sid, '_pcof_activo', true ) ? '<em>Desactivada</em>' : esc_html( (string) get_post_meta( $sid, '_pcof_estado', true ) ?: '—' ); ?></td>
					<td><?php $t = (int) get_post_meta( $sid, '_pcof_ultima', true ); echo $t ? esc_html( human_time_diff( $t ) . ' atrás' ) : '—'; ?></td>
				</tr>
			<?php endforeach; ?>
			</tbody></table>
		</div>
		<?php
	}
}
