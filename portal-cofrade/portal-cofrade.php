<?php
/**
 * Plugin Name: InfoCofrade
 * Description: Portal de noticias y enciclopedia cofrade de las ocho capitales andaluzas: agrega noticias de prensa, webs oficiales y agregadores, y mantiene fichas de capitales, hermandades, bandas e imagineros.
 * Version: 1.1.0
 * Requires at least: 5.9
 * Requires PHP: 7.4
 * Author: InfoCofrade
 * License: GPL-2.0-or-later
 * Text Domain: portal-cofrade
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'PCOF_VERSION', '1.1.0' );
define( 'PCOF_FILE', __FILE__ );
define( 'PCOF_DIR', plugin_dir_path( __FILE__ ) );
define( 'PCOF_URL', plugin_dir_url( __FILE__ ) );

require_once PCOF_DIR . 'includes/class-pcof-util.php';
require_once PCOF_DIR . 'includes/class-pcof-types.php';
require_once PCOF_DIR . 'includes/class-pcof-importer.php';
require_once PCOF_DIR . 'includes/class-pcof-news.php';
require_once PCOF_DIR . 'includes/class-pcof-render.php';
require_once PCOF_DIR . 'includes/class-pcof-admin.php';

PCOF_Types::init();
PCOF_News::init();
PCOF_Render::init();
PCOF_Admin::init();

register_activation_hook( __FILE__, 'pcof_activate' );
register_deactivation_hook( __FILE__, 'pcof_deactivate' );

function pcof_activate() {
	PCOF_Types::register();
	PCOF_News::schedule( true );
	flush_rewrite_rules();
	// El panel lanza la importación automáticamente la primera vez.
	if ( ! get_option( 'pcof_imported_version' ) ) {
		set_transient( 'pcof_autoimport', 1, 10 * MINUTE_IN_SECONDS );
	}
}

function pcof_deactivate() {
	wp_clear_scheduled_hook( PCOF_News::CRON_HOOK );
	flush_rewrite_rules();
}
