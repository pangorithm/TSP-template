//! TSP-template library — constructs and runs the Tauri v2 application.

/// Runs the Tauri application.
///
/// # Errors
/// Returns an error reported by `tauri::Builder::run`.
pub fn run() -> tauri::Result<()> {
    tauri::Builder::default().run(tauri::generate_context!())
}

/// Reports a startup error and terminates with a nonzero exit status.
pub fn report_startup_error(error: tauri::Error) -> ! {
    eprintln!("failed to run Tauri application: {error}");
    std::process::exit(1);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn mobile_entrypoint() {
    if let Err(error) = run() {
        report_startup_error(error);
    }
}

#[cfg(test)]
mod tests {
    use crate::run;

    #[test]
    fn configured_main_window_has_expected_title_and_size() {
        // Given: the Tauri context generated from the application configuration.
        let context: tauri::Context<tauri::Wry> = tauri::generate_context!();

        // When: the configured main window is selected.
        let window = context
            .config()
            .app
            .windows
            .first()
            .expect("the application config must define a main window");

        // Then: its user-facing identity and initial dimensions are explicit.
        assert_eq!(window.label, "main");
        assert_eq!(window.title, "TSP Template");
        assert_eq!(window.width, 1280.0);
        assert_eq!(window.height, 720.0);
    }

    #[test]
    fn public_bootstrap_is_fallible_while_mobile_entrypoint_returns_unit() {
        // Given: the public desktop and mobile bootstrap entrypoints.
        // When: the compiler checks their function signatures.
        let _: fn() -> tauri::Result<()> = run;
        let _: fn() = crate::mobile_entrypoint;

        // Then: the fallible builder call cannot be discarded by the mobile macro.
    }
}
