use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Client {
    pub id: String,
    pub name: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub client_id: String,
    pub name: String,
    pub created_at: String,
    /// How often the "still working on this?" check-in fires while this
    /// project is being tracked, and the unit its time is reported in
    /// (e.g. a "daily" project counts as 1 day for any day touched).
    #[serde(default)]
    pub interval: Interval,
    /// Optional billing rate, interpreted per `interval`'s own unit (price
    /// per hour for hourly projects, per day for daily, per week for weekly).
    #[serde(default)]
    pub rate: Option<f64>,
    /// ISO 4217 currency code (e.g. "USD") the rate is denominated in.
    #[serde(default)]
    pub currency: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeEntry {
    pub id: String,
    pub client_id: String,
    pub project_id: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub duration_seconds: i64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Interval {
    Hourly,
    Daily,
    Weekly,
}

impl Default for Interval {
    fn default() -> Self {
        Interval::Hourly
    }
}

impl Interval {
    pub fn threshold_seconds(&self) -> i64 {
        match self {
            Interval::Hourly => 3600,
            Interval::Daily => 86400,
            Interval::Weekly => 604800,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub active_entry_id: Option<String>,
}

/// Records that a project's tracked time for one calendar week has been
/// invoiced to the client. `period_start` is an opaque "YYYY-MM-DD" identity
/// key (that week's Monday) produced by the frontend's `weekStart()` — Rust
/// never recomputes calendar boundaries itself.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BilledPeriod {
    pub id: String,
    pub project_id: String,
    pub period_start: String,
    pub billed_at: String,
    /// Optional client-facing invoice reference, editable after the period
    /// is marked billed.
    #[serde(default)]
    pub invoice_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppData {
    pub version: u32,
    pub clients: Vec<Client>,
    pub projects: Vec<Project>,
    pub time_entries: Vec<TimeEntry>,
    #[serde(default)]
    pub billed_periods: Vec<BilledPeriod>,
    pub settings: Settings,
}

impl Default for AppData {
    fn default() -> Self {
        AppData {
            version: 1,
            clients: Vec::new(),
            projects: Vec::new(),
            time_entries: Vec::new(),
            billed_periods: Vec::new(),
            settings: Settings {
                active_entry_id: None,
            },
        }
    }
}
