// Tauri v2 entry point — delegates to `run()` in lib.rs so the build context
// is generated once and the logic path stays single-responsibility.
fn main() {
    tsp_template::run();
}
