// Tauri v2 entry point — delegates to `run()` in lib.rs so the build context
// is generated once and the logic path stays single-responsibility.
fn main() {
    if let Err(error) = tsp_template::run() {
        tsp_template::report_startup_error(error);
    }
}
