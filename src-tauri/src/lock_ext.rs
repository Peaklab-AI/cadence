use std::sync::{Mutex, MutexGuard};

/// A poisoned `std::sync::Mutex` (a panic occurred while some thread held
/// it) otherwise makes every future `.lock()` on it panic too, permanently
/// wedging every command that touches `AppState` for the rest of the
/// process's life. Everything behind these locks (`AppData`,
/// `TrackingState`, `PathBuf`, `()`) is plain owned data with no invariants
/// enforced across separate lock acquisitions, so recovering the last
/// in-memory value and continuing is safe and strictly better than a
/// guaranteed permanent freeze.
pub trait LockOrRecover<T> {
    fn lock_or_recover(&self) -> MutexGuard<'_, T>;
}

impl<T> LockOrRecover<T> for Mutex<T> {
    fn lock_or_recover(&self) -> MutexGuard<'_, T> {
        self.lock().unwrap_or_else(|poisoned| {
            eprintln!(
                "cadence: recovering from a poisoned mutex (a prior operation panicked while holding it); \
                 continuing with its last in-memory state instead of freezing"
            );
            poisoned.into_inner()
        })
    }
}
