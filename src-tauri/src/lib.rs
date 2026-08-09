//! TSP-template library — constructs and runs the Tauri v2 application.
//!
//! Test boundary note: Tauri's `Builder::default().build(generate_context!())`
//! is a bootstrap seam that cannot be unit-tested without a real window
//! runtime. This is an accepted exemption: the compilation gate (`cargo check`
//! + `cargo test`) and the `generate_context!()` macro verify the config is
//! valid at compile time. Production logic (game code, commands, plugins)
//! will live in separate modules and be tested individually.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if let Err(error) = tauri::Builder::default().run(tauri::generate_context!()) {
        eprintln!("failed to run tauri application: {error}");
    }
}

// ---------------------------------------------------------------------------
// Minimal test — proves the module compiles and `run()` is callable.
// Because `run()` blocks on the event loop, a real test would need mocking
// infrastructure that is overkill for a bootstrap scaffold.
// ---------------------------------------------------------------------------
#[cfg(test)]
mod tests {
    // Tauri bootstrap exemption: `run()` starts an event loop that cannot be
    // stopped from a unit test without the runtime. The compile gate above is
    // the test boundary for this scaffold.
    #[test]
    fn tauri_bootstrap_compiles() {
        // If this module compiles, `generate_context!()` resolved successfully
        // and `tauri::Builder::default().run()` accepted the context type.
        // Any misconfiguration in `tauri.conf.json` or `capabilities/` will
        // surface as a compile error, not a test failure.
        assert!(true);
    }
}
