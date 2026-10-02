<?php
// Al borrar el plugin se eliminan solo sus ajustes y la tarea programada.
// Las fichas, noticias y páginas creadas se conservan a propósito.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}
wp_clear_scheduled_hook( 'pcof_cron_fetch' );
foreach ( array( 'pcof_interval', 'pcof_retencion', 'pcof_keywords', 'pcof_last_run', 'pcof_last_purge', 'pcof_imported_version', 'pcof_fuentes_seeded', 'pcof_fuentes_urls', 'pcof_pages' ) as $o ) {
	delete_option( $o );
}
delete_transient( 'pcof_counts' );
delete_transient( 'pcof_autoimport' );
